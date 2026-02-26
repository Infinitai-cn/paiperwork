class RAG {

  // Document Management Methods

  // Processes an array of files (PDF or text), extracting content, chunking, embedding, and storing in the database.
  static async processDocuments(files, hashedMasterKey, progressCallback, model) {
    //console.log("RAG: Processing documents with model:", model);

    // Track total progress across all files
    let overallProgress = 0;
    const totalFiles = files.length;

    // Process each file sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNum = i + 1;

      try {
        // Notify about starting this file
        if (progressCallback) {
          const currentProgress = overallProgress / totalFiles;
          progressCallback(
            currentProgress,
            `Processing file ${fileNum}/${totalFiles}: ${file.name}`
          );
        }

        // Process file based on its type
        if (file.type === "application/pdf") {
          // Use the class method instead of a global function
          await this.processPdfDocument(
            file,
            hashedMasterKey,
            (fileProgress) => {
              // Calculate overall progress based on file progress
              if (progressCallback) {
                const fileWeight = 1 / totalFiles;
                const adjustedProgress =
                  overallProgress + fileProgress * fileWeight;
                progressCallback(
                  adjustedProgress,
                  `Processing file ${fileNum}/${totalFiles}: ${file.name
                  } (${Math.round(fileProgress * 100)}%)`
                );
              }
            },
            model
          );
        } else if (file.type === "text/plain") {
          // Use the class method instead of a global function
          await this.processTextDocument(
            file,
            hashedMasterKey,
            (fileProgress) => {
              if (progressCallback) {
                const fileWeight = 1 / totalFiles;
                const adjustedProgress =
                  overallProgress + fileProgress * fileWeight;
                progressCallback(
                  adjustedProgress,
                  `Processing file ${fileNum}/${totalFiles}: ${file.name
                  } (${Math.round(fileProgress * 100)}%)`
                );
              }
            },
            model
          );
        }

        // Update progress after file is complete
        overallProgress += 1 / totalFiles;

        if (progressCallback) {
          progressCallback(
            overallProgress,
            `Completed file ${fileNum}/${totalFiles}: ${file.name}`
          );
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        throw error;
      }
    }

    if (progressCallback) {
      progressCallback(1.0, "All documents processed successfully");
    }

    return true;
  }

  // Processes a single PDF document: extracts text, chunks, generates embeddings, and stores in the database.
  static async processPdfDocument(
    file,
    hashedMasterKey,
    progressCallback,
    selectedModel
  ) {
    // Load PDF.js library dynamically if not already loaded
    if (typeof window.pdfjsLib === "undefined") {
      //console.log("PDF.js not found, loading dynamically...");

      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "module";
        script.textContent = `
                    import * as pdfjs from './js/libraries/PDFjs/pdf.mjs';
                    window.pdfjsLib = pdfjs;
                    try {
                        // Set worker source properly based on PDF.js version
                        if (pdfjs.GlobalWorkerOptions) {
                            pdfjs.GlobalWorkerOptions.workerSrc = './js/libraries/PDFjs/pdf.worker.mjs';
                        } else if (pdfjs.getDocument) {
                            pdfjs.getDocument.workerSrc = './js/libraries/PDFjs/pdf.worker.mjs';
                        }
                        document.dispatchEvent(new Event('pdfjs-loaded'));
                    } catch (err) {
                        console.error("Error setting PDF.js worker:", err);
                    }
                `;

        document.addEventListener("pdfjs-loaded", resolve, { once: true });
        script.onerror = reject;
        document.head.appendChild(script);
      });

      //console.log("PDF.js loaded dynamically");
    }

    try {
      // Generate a unique ID for this document
      const documentId = crypto.randomUUID();
      const documentName = file.name;
      const dateAdded = new Date().toISOString();

      // Report initial progress (5%)
      if (progressCallback)
        progressCallback(0.05, `Loading PDF: ${documentName}...`);

      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Get total pages - DEFINE THIS VARIABLE HERE
      const totalPages = pdf.numPages;
      //console.log(`PDF loaded with ${totalPages} pages`);

      // Report progress after PDF is loaded (10%)
      if (progressCallback)
        progressCallback(0.1, `PDF loaded, extracting metadata...`);

      // Extract metadata
      const metadata = await pdf.getMetadata().catch(() => ({}));
      const documentInfo = {
        title: documentName, // Use the filename first
        originalTitle: metadata?.info?.Title || "", // Store original title separately
        author: metadata?.info?.Author || "Unknown",
        creationDate: metadata?.info?.CreationDate || dateAdded,
        pageCount: totalPages,
      };

      // Report progress after metadata extraction (15%)
      if (progressCallback)
        progressCallback(0.15, `Creating document record...`);

      // Save document info to database
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);

      // Encrypt document info
      const encryptedName = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, documentName)
      );
      const encryptedMetadata = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(documentInfo))
      );
      const encryptedDateAdded = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, dateAdded)
      );

      // Insert with consistent column names
      db.exec(`
                INSERT INTO documents_${hashedMasterKey}
                (document_id, document_name, document_metadata, date_added, embedding_status, total_chunks)
                VALUES (
                    '${documentId}', 
                    '${encryptedName}', 
                    '${encryptedMetadata}', 
                    '${encryptedDateAdded}', 
                    'processing',
                    0
                )
            `);

      // Process each page of the PDF
      const chunks = []; // INITIALIZE CHUNKS ARRAY
      const baseProgress = 0.2;
      const pageProgressWeight = 0.7 / totalPages; // 70% of progress split across pages

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        // Calculate the current progress based on page number
        const currentPageProgress =
          baseProgress + pageProgressWeight * (pageNum - 1);

        if (progressCallback) {
          progressCallback(
            currentPageProgress,
            `Processing page ${pageNum} of ${totalPages}...`
          );
        }

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // IMPROVED CHUNKING STRATEGY:
        // Instead of tiny paragraph chunks, create larger semantic chunks

        // 1. Extract all text from the page
        let pageText = "";
        let lastY;
        let paragraphs = [];

        // Build paragraphs first
        for (const item of textContent.items) {
          if (lastY !== undefined && Math.abs(lastY - item.transform[5]) > 5) {
            if (pageText.trim()) {
              paragraphs.push(pageText.trim());
            }
            pageText = "";
          }
          pageText += item.str + " ";
          lastY = item.transform[5];
        }

        // Add the last paragraph
        if (pageText.trim()) {
          paragraphs.push(pageText.trim());
        }

        // 2. Smart Chunking Based on Content Size
        const processChunks = [];
        let currentChunk = "";
        const TARGET_CHUNK_SIZE = 1000; // Target ~1000 characters per chunk
        const MAX_CHUNK_SIZE = 1500; // Maximum chunk size

        // Combine paragraphs into reasonably sized chunks
        for (const paragraph of paragraphs) {
          // Skip very small paragraphs (likely headers or page numbers)
          if (paragraph.length < 20) continue;

          // If adding this paragraph would make chunk too big, save current chunk
          if (
            currentChunk.length > 0 &&
            (currentChunk.length + paragraph.length > MAX_CHUNK_SIZE ||
              currentChunk.split(" ").length + paragraph.split(" ").length >
              350)
          ) {
            processChunks.push(currentChunk);
            currentChunk = "";
          }

          // Add paragraph to the current chunk
          if (currentChunk.length > 0) {
            currentChunk += "\n\n";
          }
          currentChunk += paragraph;

          // If we've reached a good chunk size and are at a natural break, save it
          if (
            currentChunk.length >= TARGET_CHUNK_SIZE &&
            paragraph.endsWith(".")
          ) {
            processChunks.push(currentChunk);
            currentChunk = "";
          }
        }

        // Don't forget the last chunk
        if (currentChunk.length > 0) {
          processChunks.push(currentChunk);
        }

        // For pages with very little text, just use the whole page
        if (processChunks.length === 0 && paragraphs.length > 0) {
          processChunks.push(paragraphs.join("\n\n"));
        }

        // 3. Generate embeddings and store chunks
        // Each chunk processing should update progress within the page's progress allocation
        const numChunks = processChunks.length;
        const chunkProgressWeight = pageProgressWeight / Math.max(1, numChunks);

        for (let i = 0; i < processChunks.length; i++) {
          const chunk = processChunks[i];
          const chunkId = crypto.randomUUID();

          // Calculate progress for this specific chunk
          const chunkProgress = currentPageProgress + chunkProgressWeight * i;
          if (progressCallback) {
            progressCallback(
              chunkProgress,
              `Processing page ${pageNum}/${totalPages}, chunk ${i + 1
              }/${numChunks}...`
            );
          }

          // Enhanced metadata for better context
          const chunkMetadata = {
            source: documentName,
            page: pageNum,
            chunkIndex: i + 1,
            totalChunks: processChunks.length,
            documentId: documentId,
            charCount: chunk.length,
            wordCount: chunk.split(/\s+/).length,
          };

          // Generate embedding for this chunk
          const embedding = await this.generateEmbedding(chunk, selectedModel);

          // Encrypt chunk data
          const encryptedText = JSON.stringify(
            await PaiperworkDB.encrypt(hashedMasterKey, chunk)
          );
          const encryptedEmbedding = JSON.stringify(
            await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(embedding))
          );
          const encryptedMetadata = JSON.stringify(
            await PaiperworkDB.encrypt(
              hashedMasterKey,
              JSON.stringify(chunkMetadata)
            )
          );

          // Store chunk with consistent column names
          db.exec(`
                        INSERT INTO document_chunks_${hashedMasterKey}
                        (chunk_id, document_id, chunk_text, chunk_embedding, chunk_metadata)
                        VALUES (
                            '${chunkId}',
                            '${documentId}',
                            '${encryptedText}',
                            '${encryptedEmbedding}',
                            '${encryptedMetadata}'
                        )
                    `);

          chunks.push({
            id: chunkId,
            text: chunk.substring(0, 50) + "...",
            page: pageNum,
            charCount: chunk.length,
          });
        }
      }

      // Report progress at 90% - finalizing
      if (progressCallback) progressCallback(0.9, `Finalizing document...`);

      // Update document status
      db.exec(`
                UPDATE documents_${hashedMasterKey}
                SET total_chunks = ${chunks.length}, embedding_status = 'completed'
                WHERE document_id = '${documentId}'
            `);

      await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);

      // Report 100% progress when complete
      if (progressCallback)
        progressCallback(1.0, `Document processing complete`);

      return {
        documentId,
        name: documentName,
        chunks: chunks.length,
      };
    } catch (error) {
      console.error(`Error processing PDF: ${error.message}`);
      if (progressCallback) progressCallback(null, `Error: ${error.message}`);
      throw error;
    }
  }
  // Processes a single plain text document: splits into chunks, generates embeddings, and stores in the database.
  static async processTextDocument(
    file,
    hashedMasterKey,
    progressCallback,
    selectedModel
  ) {
    // Generate a unique ID for this document
    const documentId = crypto.randomUUID();
    const documentName = file.name;
    const dateAdded = new Date().toISOString();

    // Report initial progress (5%)
    if (progressCallback)
      progressCallback(0.05, `Reading text file: ${documentName}...`);

    // Read the text file
    const text = await file.text();

    // Report progress after text is loaded (10%)
    if (progressCallback)
      progressCallback(0.1, `Text loaded, analyzing content...`);

    // Extract metadata
    const documentInfo = {
      title: documentName.replace(".txt", ""),
      author: "Unknown",
      creationDate: dateAdded,
      format: "text",
    };

    // Report progress (15%)
    if (progressCallback) progressCallback(0.15, `Creating document record...`);

    // Save document info to database
    const db = await PaiperworkDB.getDatabase(hashedMasterKey);

    // Encrypt document info
    const encryptedName = JSON.stringify(
      await PaiperworkDB.encrypt(hashedMasterKey, documentName)
    );
    const encryptedMetadata = JSON.stringify(
      await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(documentInfo))
    );
    const encryptedDateAdded = JSON.stringify(
      await PaiperworkDB.encrypt(hashedMasterKey, dateAdded)
    );

    // Insert with consistent column names
    db.exec(`
        INSERT INTO documents_${hashedMasterKey}
        (document_id, document_name, document_metadata, date_added, embedding_status, total_chunks)
        VALUES (
            '${documentId}', 
            '${encryptedName}', 
            '${encryptedMetadata}', 
            '${encryptedDateAdded}', 
            'processing',
            0
        )
    `);

    // Report progress (20%)
    if (progressCallback)
      progressCallback(0.2, `Splitting document into sections...`);

    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    // Report progress (25%)
    if (progressCallback)
      progressCallback(
        0.25,
        `Found ${paragraphs.length} paragraphs in text document`
      );

    // Apply smart chunking similar to PDF processing
    const processChunks = [];
    let currentChunk = "";
    const TARGET_CHUNK_SIZE = 1000;
    const MAX_CHUNK_SIZE = 1500;

    // Combine paragraphs into reasonably sized chunks
    for (const paragraph of paragraphs) {
      // Skip very small paragraphs (likely headers)
      if (paragraph.length < 20) continue;

      // If adding this paragraph would make chunk too big, save current chunk
      if (
        currentChunk.length > 0 &&
        (currentChunk.length + paragraph.length > MAX_CHUNK_SIZE ||
          currentChunk.split(" ").length + paragraph.split(" ").length > 350)
      ) {
        processChunks.push(currentChunk);
        currentChunk = "";
      }

      // Add paragraph to the current chunk
      if (currentChunk.length > 0) {
        currentChunk += "\n\n";
      }
      currentChunk += paragraph;

      // If we've reached a good chunk size and are at a natural break, save it
      if (currentChunk.length >= TARGET_CHUNK_SIZE && paragraph.endsWith(".")) {
        processChunks.push(currentChunk);
        currentChunk = "";
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      processChunks.push(currentChunk);
    }

    // Report progress (30%)
    if (progressCallback)
      progressCallback(
        0.3,
        `Created ${processChunks.length} optimized chunks for processing`
      );

    // Process and store chunks
    const chunks = [];
    const totalChunks = processChunks.length;
    const chunkProgressWeight = 0.6 / Math.max(1, totalChunks); // 60% of progress allocated to chunks

    for (let i = 0; i < processChunks.length; i++) {
      const chunkIndex = i + 1;

      // Calculate progress for this specific chunk (30% baseline + chunk's portion)
      const chunkProgress = 0.3 + i * chunkProgressWeight;

      if (progressCallback) {
        progressCallback(
          chunkProgress,
          `Processing chunk ${chunkIndex} of ${totalChunks}...`
        );
      }

      const chunk = processChunks[i];
      const chunkId = crypto.randomUUID();

      // Enhanced metadata
      const chunkMetadata = {
        source: documentName,
        section: chunkIndex,
        chunkIndex: chunkIndex,
        totalChunks: processChunks.length,
        documentId: documentId,
        charCount: chunk.length,
        wordCount: chunk.split(/\s+/).length,
      };

      // Generate embedding for this chunk
      const embedding = await this.generateEmbedding(chunk, selectedModel);

      // Encrypt chunk data (FIXED: using chunk not paragraph)
      const encryptedText = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, chunk)
      );
      const encryptedEmbedding = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(embedding))
      );
      const encryptedMetadata = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(chunkMetadata))
      );

      // Store chunk with consistent column names
      db.exec(`
            INSERT INTO document_chunks_${hashedMasterKey}
            (chunk_id, document_id, chunk_text, chunk_embedding, chunk_metadata)
            VALUES (
                '${chunkId}',
                '${documentId}',
                '${encryptedText}',
                '${encryptedEmbedding}',
                '${encryptedMetadata}'
            )
        `);

      chunks.push({
        id: chunkId,
        text: chunk.substring(0, 50) + "...",
      });
    }

    // Report progress at 90% - finalizing
    if (progressCallback) progressCallback(0.9, `Finalizing document...`);

    // Update document status
    db.exec(`
        UPDATE documents_${hashedMasterKey}
        SET total_chunks = ${chunks.length}, embedding_status = 'completed'
        WHERE document_id = '${documentId}'
    `);

    await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);

    // Report 100% progress when complete
    if (progressCallback)
      progressCallback(1.0, `Text document processing complete`);

    return {
      documentId,
      name: documentName,
      chunks: chunks.length,
    };
  }
  // Loads all documents from the database for the given master key, decrypting metadata.
  static async loadDocuments(hashedMasterKey) {
    try {
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);
      if (!db) {
        console.error("RAG: Database not available");
        return [];
      }

      // Check table structure
      const tableInfo = db.exec(`PRAGMA table_info(documents_${hashedMasterKey})`);
      //console.log("RAG: Table structure:", tableInfo);

      if (!tableInfo[0]?.values || tableInfo[0].values.length === 0) {
        console.warn("RAG: Documents table missing or empty");
        return [];
      }

      // Build column names map
      const columnNames = tableInfo[0].values.map((col) => col[1]);
      const hasDocumentPrefix = columnNames.includes("document_id");

      //console.log("RAG: Using document_ prefix:", hasDocumentPrefix);

      // Use the appropriate column names based on table structure
      const query = hasDocumentPrefix
        ? `SELECT document_id, document_name, document_metadata, date_added, total_chunks, embedding_status 
             FROM documents_${hashedMasterKey} 
             ORDER BY date_added DESC`
        : `SELECT id, name, metadata, dateAdded, totalChunks, status 
             FROM documents_${hashedMasterKey} 
             ORDER BY dateAdded DESC`;

      //console.log("RAG: Executing query:", query);
      const result = db.exec(query);

      if (!result || result.length === 0 || !result[0]?.values) {
        //console.log("RAG: No documents found in table");
        return [];
      }

      //console.log("RAG: Documents found:", result[0].values.length);

      // Process documents using our mapping function
      const documents = [];
      for (const row of result[0].values) {
        const doc = await this.mapDocumentFromDb(row, hashedMasterKey);
        if (doc) documents.push(doc);
      }

      return documents;
    } catch (error) {
      console.error("RAG: Error loading documents:", error);
      return [];
    }
  }
  // Deletes a document and its associated chunks from the database by document ID.
  static async deleteDocument(documentId, hashedMasterKey) {
    try {
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);

      // Check table structure
      const tableInfo = db.exec(`PRAGMA table_info(documents_${hashedMasterKey})`);
      const documentColumns = tableInfo[0]?.values.map((col) => col[1]) || [];
      const hasDocumentPrefix = documentColumns.includes("document_id");

      // Use appropriate table and column names
      const docIdCol = hasDocumentPrefix ? "document_id" : "id";
      const chunkTableName = hasDocumentPrefix
        ? `document_chunks_${hashedMasterKey}`
        : `chunks_${hashedMasterKey}`;
      const chunkIdCol = "document_id";

      // Check if chunks table exists
      const chunkTableExists =
        db.exec(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='${chunkTableName}'
        `)[0]?.values.length > 0;

      // Delete from chunks table if it exists
      if (chunkTableExists) {
        db.exec(
          `DELETE FROM ${chunkTableName} WHERE ${chunkIdCol} = '${documentId}'`
        );
      }

      // Delete document record
      db.exec(
        `DELETE FROM documents_${hashedMasterKey} WHERE ${docIdCol} = '${documentId}'`
      );

      // Save changes
      await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);
      return true;
    } catch (error) {
      console.error("RAG: Error deleting document:", error);
      return false;
    }
  }

  // Retrieves the most relevant document chunks for a user prompt using embedding similarity.
  static async retrieveRelevantChunks(userPrompt, hashedMasterKey, limit = 5) {
    const modelSelector = document.getElementById("model-selector");
    const selectedModel = modelSelector.value;

    // Generate embedding for the user prompt
    const promptEmbedding = await this.generateEmbedding(
      userPrompt,
      selectedModel
    );

    // Fetch all chunks and calculate similarity
    const db = await PaiperworkDB.getDatabase(hashedMasterKey);
    const chunksResult = db.exec(`
        SELECT chunk_id, document_id, chunk_text, chunk_embedding, chunk_metadata
        FROM document_chunks_${hashedMasterKey}
    `);

    if (!chunksResult[0]?.values) {
      return [];
    }

    // Calculate similarity for each chunk
    const similarities = [];
    for (const [
      chunkId,
      docId,
      encText,
      encEmbedding,
      encMetadata,
    ] of chunksResult[0].values) {
      const embedding = JSON.parse(
        await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
      );
      const similarity = this.calculateCosineSimilarity(
        promptEmbedding,
        embedding
      );

      if (similarity > 0.7) {
        // Only include relevant chunks
        const text = await PaiperworkDB.decrypt(
          hashedMasterKey,
          JSON.parse(encText)
        );
        const metadata = JSON.parse(
          await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata))
        );

        similarities.push({
          chunkId,
          docId,
          text,
          metadata,
          similarity,
          pageNum: metadata.page,
        });
      }
    }

    // Sort by similarity (highest first) and take top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }

  // Calculates the cosine similarity between two embedding vectors.
  static calculateCosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  // Maps a database row to a standardized document object, decrypting fields as needed.
  static async mapDocumentFromDb(dbRow, hashedMasterKey) {
    try {
      // Handle different column naming conventions
      let id, encName, encMetadata, encDateAdded, totalChunks, status;

      // Check if we have the old column name format or new format
      if (dbRow.length === 6) {
        // Standard 6-column format
        [id, encName, encMetadata, encDateAdded, totalChunks, status] = dbRow;
      } else {
        console.warn("RAG: Unexpected database row format:", dbRow);
        return null;
      }

      // Decrypt and convert data
      const name = await PaiperworkDB.decrypt(
        hashedMasterKey,
        JSON.parse(encName)
      );
      let metadata;
      try {
        metadata = JSON.parse(
          await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata))
        );
      } catch (error) {
        console.warn("RAG: Error parsing metadata, using empty object:", error);
        metadata = {};
      }
      const dateAdded = await PaiperworkDB.decrypt(
        hashedMasterKey,
        JSON.parse(encDateAdded)
      );

      // Return standardized object
      return {
        id,
        name,
        metadata,
        dateAdded,
        totalChunks: totalChunks || 0,
        status: status || "completed",
      };
    } catch (error) {
      console.error("RAG: Error mapping document from database:", error);
      return null;
    }
  }
  // Generates an embedding vector for the given text using the specified model.
  static async generateEmbedding(text, model) {
    if (!model) {
      console.error("No model provided for embedding generation");
      throw new Error("No model provided for embedding generation");
    }

    try {
      const extractEmbedding = (responseData) => {
        if (
          responseData.embeddings &&
          Array.isArray(responseData.embeddings) &&
          responseData.embeddings.length > 0
        ) {
          return responseData.embeddings[0];
        }

        if (
          responseData.embedding &&
          Array.isArray(responseData.embedding) &&
          responseData.embedding.length > 0
        ) {
          return responseData.embedding;
        }

        if (
          responseData.data &&
          responseData.data.embeddings &&
          Array.isArray(responseData.data.embeddings) &&
          responseData.data.embeddings.length > 0
        ) {
          return responseData.data.embeddings[0];
        }

        if (
          responseData.data &&
          responseData.data.embedding &&
          Array.isArray(responseData.data.embedding) &&
          responseData.data.embedding.length > 0
        ) {
          return responseData.data.embedding;
        }

        return null;
      };

      const endpointConfigs = [
        {
          url: "http://localhost:11434/api/embed",
          createBody: (inputText, options) => ({ model, input: inputText, options }),
        },
        {
          url: "http://localhost:11434/api/embeddings",
          createBody: (inputText, options) => ({ model, prompt: inputText, options }),
        },
      ];

      const endpointFallbackStatuses = new Set([404, 405, 501]);

      const requestEmbedding = async (inputText, options) => {
        let lastError = null;

        for (let i = 0; i < endpointConfigs.length; i++) {
          const endpoint = endpointConfigs[i];
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(endpoint.createBody(inputText, options)),
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error(
              `Embedding API responded with error from ${endpoint.url}:`,
              errorData
            );

            if (
              errorData.includes("does not support embedding") ||
              errorData.includes("this model does not support")
            ) {
              this.showEmbeddingWarning(model);
              throw new Error(`Model ${model} does not support embeddings`);
            }

            if (i === 0 && endpointFallbackStatuses.has(response.status)) {
              lastError = new Error(
                `Embedding API error (${response.status}) from ${endpoint.url}: ${errorData}`
              );
              continue;
            }

            throw new Error(
              `Embedding API error (${response.status}) from ${endpoint.url}: ${errorData}`
            );
          }

          const responseData = await response.json();
          const extractedEmbedding = extractEmbedding(responseData);

          if (extractedEmbedding) {
            return extractedEmbedding;
          }

          lastError = new Error(
            `Embedding API returned no embeddings from ${endpoint.url}`
          );
        }

        throw lastError || new Error("Embedding API returned no embeddings");
      };

      try {
        return await requestEmbedding(text, {
          timeout: 30000,
        });
      } catch (initialError) {
        const initialErrorText = String(initialError);
        if (
          initialErrorText.includes("does not support embedding") ||
          initialErrorText.includes("this model does not support")
        ) {
          throw initialError;
        }

        console.warn(
          `Model ${model} returned empty embeddings or initial request failed, trying with modified settings`,
          initialError
        );
      }

      const enhancedText = text.length < 100 ? text + " " + text : text;

      try {
        return await requestEmbedding(enhancedText, {
          temperature: 0,
          num_ctx: 2048,
          timeout: 30000,
        });
      } catch (enhancedError) {
        console.error("Enhanced embedding request failed:", enhancedError);
      }

      console.error("All embedding attempts failed for model:", model);
      this.showEmbeddingWarning(model);
      throw new Error(`Failed to generate embeddings with model: ${model}`);
    } catch (error) {
      // Check if this error is already our handled "model doesn't support embeddings" error
      if (error.message.includes("does not support embeddings")) {
        // Just re-throw this error since we've already shown the warning
        throw error;
      }

      // For other errors, check the error text for mentions of embedding support
      const errorString = String(error);
      if (errorString.includes("does not support embedding") ||
        errorString.includes("this model does not support")) {

        // Show warning UI
        this.showEmbeddingWarning(model);

        // Then throw an error to prevent continuing with synthetic embeddings
        throw new Error(`Model ${model} does not support embeddings`);
      }

      // For all other errors, log and throw without showing the warning
      console.error("Embedding generation error:", error);
      throw error;
    }
  }
  // Displays a warning notification if the selected model does not support embeddings.
  static showEmbeddingWarning(modelName) {
    //console.log(`Showing embedding warning for model: ${modelName}`);

    // First remove any existing warnings
    const existingWarnings = document.querySelectorAll('.embedding-warning-notification');
    existingWarnings.forEach(el => el.remove());

    // Create the warning notification
    const notification = document.createElement('div');
    notification.className = 'embedding-warning-notification';

    // Style for visibility and impact
    notification.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 450px;
      background-color: #FEF2F2;
      color: #B91C1C;
      border-left: 6px solid #EF4444;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 9999;
      font-size: 14px;
      text-align: left;
      line-height: 1.5;
      animation: fadeIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; display: flex; align-items: center;">
        <span style="margin-right: 8px; font-size: 20px;">⚠️</span> 
        ${Lang.get('ragModelNotCompatibleTitle', 'Model Not Compatible with Document Search')}
      </h3>
      <p style="margin-bottom: 12px; font-size: 15px;">
        ${Lang.get('ragModelNotCompatibleMessage', 'The model <strong>{model}</strong> doesn\'t support embeddings, which are required for document search and RAG functionality.').replace('{model}', modelName)}
      </p>
      <p style="margin-bottom: 16px; font-size: 15px;">
        ${Lang.get('ragModelSelectCompatible', 'Please select a model that supports embeddings (such as nomic-embed-text, llama3, mistral or mixtral models).')}
      </p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="https://ollama.com/search?q=&sort=downloads&filter=embedding" 
           target="_blank" style="color: #4F46E5; text-decoration: underline; font-weight: 600;">
           ${Lang.get('ragFindEmbeddingModels', 'Find embedding-capable models')}
        </a>
        <button id="close-embedding-warning" style="background: #DC2626; border: none; color: white; 
                padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">
            ${Lang.get('ragIUnderstand', 'I Understand')}
        </button>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Add click handler for the close button
    document.getElementById('close-embedding-warning').addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -20px)';
      notification.style.transition = 'opacity 0.3s, transform 0.3s';

      setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -20px)';
        notification.style.transition = 'opacity 0.5s, transform 0.5s';

        setTimeout(() => notification.remove(), 500);
      }
    }, 30000);
  }

  // Searches all document chunks for matches to the query using embeddings and text fallback.
  static async searchDocuments(query, hashedMasterKey, model) {
    //console.log(`Searching documents for: "${query}" using model: ${model}`);

    if (!query || !hashedMasterKey) {
      throw new Error("Search query and masterkey are required");
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query, model);

      // Verify we have a valid embedding
      if (!queryEmbedding || !queryEmbedding.length) {
        throw new Error("Could not generate embedding for search query");
      }

      // Get database
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);

      // First, get all document chunks and their embeddings
      const chunksResult = db.exec(`
            SELECT 
                dc.chunk_id, 
                dc.document_id, 
                dc.chunk_text, 
                dc.chunk_embedding,
                dc.chunk_metadata,
                d.document_name
            FROM 
                document_chunks_${hashedMasterKey} dc
            JOIN 
                documents_${hashedMasterKey} d ON dc.document_id = d.document_id
        `);

      if (
        !chunksResult ||
        chunksResult.length === 0 ||
        !chunksResult[0].values
      ) {
        return [];
      }

      // Process results and calculate similarity
      const chunks = [];
      for (const [
        chunkId,
        documentId,
        encryptedText,
        encryptedEmbedding,
        encryptedMetadata,
        encryptedName,
      ] of chunksResult[0].values) {
        try {
          // Safely decrypt text and document name first
          let chunkText, documentName;

          try {
            chunkText = await PaiperworkDB.decrypt(
              hashedMasterKey,
              JSON.parse(encryptedText)
            );
            documentName = await PaiperworkDB.decrypt(
              hashedMasterKey,
              JSON.parse(encryptedName)
            );
          } catch (parseErr) {
            console.error("Error parsing JSON or decrypting text:", parseErr);
            continue; // Skip this chunk and move to the next one
          }

          // Handle embedding separately to avoid aborting the whole search on one error
          let similarity = 0;
          try {
            // Safely parse and decrypt the embedding
            let embeddingText = await PaiperworkDB.decrypt(
              hashedMasterKey,
              JSON.parse(encryptedEmbedding)
            );

            // Verify the embedding text is valid before parsing
            if (embeddingText && typeof embeddingText === "string") {
              const chunkEmbedding = JSON.parse(embeddingText);
              if (
                chunkEmbedding &&
                Array.isArray(chunkEmbedding) &&
                chunkEmbedding.length > 0
              ) {
                // Fix: Use calculateCosineSimilarity instead of cosineSimilarity
                similarity = this.calculateCosineSimilarity(
                  queryEmbedding,
                  chunkEmbedding
                );
              }
            }
          } catch (embedErr) {
            console.error("Error processing embedding:", embedErr);
            // Continue with similarity = 0 rather than skipping the chunk
          }

          // Keep the chunk either way for text search fallback
          chunks.push({
            chunkId,
            documentId,
            documentName,
            text: chunkText,
            similarity,
          });
        } catch (err) {
          console.error("Error processing chunk:", err);
          // Continue to the next chunk
        }
      }

      // If vector search failed to find good matches, try a simple text-based search
      const hasGoodMatches = chunks.some((chunk) => chunk.similarity > 0.5);

      if (!hasGoodMatches && chunks.length > 0) {
        //console.log("No good embedding matches, falling back to text search");
        const terms = query
          .toLowerCase()
          .split(/\s+/)
          .filter((term) => term.length > 2);

        // Score chunks based on term frequency
        chunks.forEach((chunk) => {
          const text = chunk.text.toLowerCase();
          let textScore = 0;

          terms.forEach((term) => {
            const count = (text.match(new RegExp(term, "g")) || []).length;
            textScore += count * 0.1; // Adjust weight as needed
          });

          // Combine with existing similarity (which might be 0)
          chunk.similarity = Math.max(chunk.similarity, textScore);
        });
      }

      // Sort by similarity (highest first) and take top results
      chunks.sort((a, b) => b.similarity - a.similarity);
      return chunks.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error("Error searching documents:", error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Checks if a specific table exists in the database for the current master key.
  static async tableExists(tableName) {
    try {
      // Initialize database connection first
  const hashedMasterKey = sessionStorage.getItem("hashedMasterKey");
      if (!hashedMasterKey) {
        console.error("RAG: No hashed masterkey available for database access");
        return false;
      }

      // Get database via PaiperworkDB
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);
      if (!db) {
        console.error("RAG: Could not access database for masterkey:", hashedMasterKey);
        return false;
      }

      // Execute the query on the retrieved database
      const result = db.exec(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='${tableName}'
            `);
      return result && result.length > 0;
    } catch (error) {
      console.error("Error checking if table exists:", error);
      return false;
    }
  }

  // Update the db getter to use PaiperworkDB
  static async getDb() {
  const hashedMasterKey = sessionStorage.getItem("hashedMasterKey");
  return await PaiperworkDB.getDatabase(hashedMasterKey);
  }
  // Searches document chunks with additional constraints (e.g., by document ID), using embeddings.
  static async searchDocumentsWithConstraint(query, hashedMasterKey, model, constraints) {
    //console.log("RAG: Searching documents with constraints:", constraints);

    if (!hashedMasterKey || !constraints) {
      console.error("RAG: Missing required parameters for searchDocumentsWithConstraint");
      return [];
    }

    try {
      // Get database
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);
      if (!db) {
        throw new Error("Database not available");
      }

      // Build WHERE clause based on constraints
      let whereClause = "";
      let whereParams = [];

      if (constraints) {
        if (constraints.documentId) {
          whereClause = "WHERE document_id = ?";
          whereParams = [constraints.documentId];
        }
      }

      // Modified: Get metadata first to determine intelligent chunk selection strategy
      const docInfoQuery = `
      SELECT COUNT(*) as chunk_count 
      FROM document_chunks_${hashedMasterKey} 
      ${whereClause}
    `;

      const countResult = db.exec(docInfoQuery, whereParams);
      const chunkCount = countResult && countResult[0]?.values?.[0]?.[0] || 0;

      // Determine appropriate limit based on document size
      let chunkLimit = 30; // Reduced from 100 to 30 as default
      if (chunkCount > 200) {
        chunkLimit = 20; // For very large documents, reduce further
      } else if (chunkCount < 50) {
        // For small documents, we can process all chunks
        chunkLimit = chunkCount;
      }

      //console.log(`RAG: Document has ${chunkCount} chunks, using limit of ${chunkLimit}`);

      // First get metadata and page numbers to enable smarter chunk selection
      const metadataQuery = `
      SELECT chunk_id, document_id, chunk_metadata
      FROM document_chunks_${hashedMasterKey}
      ${whereClause}
    `;

      const metadataResult = db.exec(metadataQuery, whereParams);

      // Process chunk metadata for smarter selection
      const chunkMeta = [];
      if (metadataResult && metadataResult[0]?.values) {
        for (const [chunkId, docId, encMetadata] of metadataResult[0].values) {
          try {
            const metadataStr = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata));
            const metadata = JSON.parse(metadataStr);
            chunkMeta.push({
              id: chunkId,
              documentId: docId,
              pageNumber: metadata.page || metadata.pageNumber || 0,
              chunkIndex: metadata.chunkIndex || 0
            });
          } catch (err) {
            console.error("Error processing chunk metadata:", err);
          }
        }
      }

      // Sort chunks by page/position for more coherent selection
      chunkMeta.sort((a, b) => {
        if (a.pageNumber === b.pageNumber) {
          return a.chunkIndex - b.chunkIndex;
        }
        return a.pageNumber - b.pageNumber;
      });

      // Select a distributed set of chunks - take from beginning, middle and end
      // to get better document coverage
      const selectedChunkIds = [];

      if (chunkMeta.length > 0) {
        // Take ~40% from beginning, ~30% from middle, ~30% from end
        const beginCount = Math.ceil(chunkLimit * 0.4);
        const middleCount = Math.floor(chunkLimit * 0.3);
        const endCount = chunkLimit - beginCount - middleCount;

        // Get chunks from beginning
        for (let i = 0; i < beginCount && i < chunkMeta.length; i++) {
          selectedChunkIds.push(chunkMeta[i].id);
        }

        // Get chunks from middle if there are enough
        if (middleCount > 0 && chunkMeta.length > beginCount + endCount) {
          const middleStart = Math.floor((chunkMeta.length - middleCount) / 2);
          for (let i = 0; i < middleCount; i++) {
            selectedChunkIds.push(chunkMeta[middleStart + i].id);
          }
        }

        // Get chunks from end
        if (endCount > 0 && chunkMeta.length > beginCount) {
          const endStart = Math.max(beginCount, chunkMeta.length - endCount);
          for (let i = 0; i < endCount && endStart + i < chunkMeta.length; i++) {
            selectedChunkIds.push(chunkMeta[endStart + i].id);
          }
        }
      }

      let chunksResult;

      // Now get full data only for selected chunks
      if (selectedChunkIds.length > 0) {
        // Build placeholders for IN clause
        const placeholders = selectedChunkIds.map(() => '?').join(',');

        const chunksQuery = `
        SELECT chunk_id, document_id, chunk_text, chunk_embedding, chunk_metadata
        FROM document_chunks_${hashedMasterKey}
        WHERE chunk_id IN (${placeholders})
      `;

        chunksResult = db.exec(chunksQuery, selectedChunkIds);
      } else {
        // If we couldn't get chunk metadata, fall back to the original query with limit
        // but avoid ORDER BY RANDOM() which is memory intensive
        const chunksQuery = `
        SELECT chunk_id, document_id, chunk_text, chunk_embedding, chunk_metadata
        FROM document_chunks_${hashedMasterKey}
        ${whereClause}
        LIMIT ${chunkLimit}
      `;

        chunksResult = db.exec(chunksQuery, whereParams);
      }

      if (!chunksResult || chunksResult.length === 0 || !chunksResult[0].values) {
        //console.log("RAG: No chunks found for document with constraints");
        return [];
      }

      // Log how many chunks we found
      //console.log(`RAG: Found ${chunksResult[0].values.length} chunks for document`);

      // Get document names for the results
      const documentMap = {};
      const docsResult = db.exec(`
        SELECT document_id, document_name 
        FROM documents_${hashedMasterKey}
    `);

      if (docsResult && docsResult.length > 0 && docsResult[0].values) {
        for (const [docId, encName] of docsResult[0].values) {
          try {
            documentMap[docId] = await PaiperworkDB.decrypt(
              hashedMasterKey,
              JSON.parse(encName)
            );
          } catch (err) {
            console.error("Error decrypting document name:", err);
            documentMap[docId] = "Unknown Document";
          }
        }
      }

      // Decrypt chunks in smaller batches (5 at a time) to reduce memory pressure
      const chunks = [];
      const chunksValues = chunksResult[0].values;
      const BATCH_SIZE = 5;

      for (let i = 0; i < chunksValues.length; i += BATCH_SIZE) {
        const batch = chunksValues.slice(i, i + BATCH_SIZE);

        for (const [chunkId, docId, encText, encEmbedding, encMetadata] of batch) {
          try {
            const text = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encText));
            chunks.push({
              id: chunkId,
              documentId: docId,
              documentName: documentMap[docId] || "Unknown Document",
              text: text,
              embedding: encEmbedding, // Keep encrypted for later use
            });
          } catch (err) {
            console.error("Error decrypting chunk:", err);
          }
        }

        // Short delay to allow garbage collection between batches
        if (i + BATCH_SIZE < chunksValues.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // If we have no query, just return the chunks without similarity calculation
      if (!query || !query.trim()) {
        //console.log("RAG: Returning chunks without similarity calculation");
        return chunks;
      }

      // For query searching, generate embedding and calculate similarities
      const queryEmbedding = await this.generateEmbedding(query, model);
      if (!queryEmbedding) {
        throw new Error("Failed to generate embedding for query");
      }

      // Calculate similarities in batches to reduce memory pressure
      const results = [];
      const SIMILARITY_BATCH_SIZE = 5;

      for (let i = 0; i < chunks.length; i += SIMILARITY_BATCH_SIZE) {
        const batch = chunks.slice(i, i + SIMILARITY_BATCH_SIZE);

        for (const chunk of batch) {
          try {
            // Decrypt embedding only when needed
            const chunkEmbedding = await this.getChunkEmbedding(
              hashedMasterKey,
              chunk.id
            );

            if (chunkEmbedding) {
              const similarity = this.calculateCosineSimilarity(
                queryEmbedding,
                chunkEmbedding
              );

              // Include results with reasonable similarity
              if (similarity > 0.3) {
                results.push({
                  ...chunk,
                  similarity: similarity,
                });
              }
            }
          } catch (err) {
            console.error("Error processing chunk for similarity:", err);
          }
        }

        // Short delay between batches
        if (i + SIMILARITY_BATCH_SIZE < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // If no semantic matches found, return top chunks anyway
      if (results.length === 0) {
        //console.log("RAG: No semantic matches, returning sample chunks instead");
        return chunks.slice(0, 3); // Return first 3 chunks as fallback
      }

      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);

      // Ensure all chunks have valid similarity values
      results.forEach(chunk => {
        if (chunk.similarity === undefined || isNaN(chunk.similarity)) {
          chunk.similarity = 0;
        }
      });

      return results.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error("RAG: Error in searchDocumentsWithConstraint:", error);
      return [];
    }
  }
  // Helper function to get a chunk's embedding
  static async getChunkEmbedding(hashedMasterKey, chunkId) {
    try {
      const db = await PaiperworkDB.getDatabase(hashedMasterKey);
      const result = db.exec(
        `
            SELECT chunk_embedding 
            FROM document_chunks_${hashedMasterKey} 
            WHERE chunk_id = ?
        `,
        [chunkId]
      );

      if (
        result &&
        result.length > 0 &&
        result[0].values &&
        result[0].values.length > 0
      ) {
        const encEmbedding = result[0].values[0][0];
        if (!encEmbedding) return null;

        return JSON.parse(
          await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
        );
      }
      return null;
    } catch (err) {
      console.error("Error getting chunk embedding:", err);
      return null;
    }
  }
  static getProcessingStatus() {
    // Check if we have a saved processing status in state
    if (window.documentProcessingState && window.documentProcessingState.statusMessage) {
      return window.documentProcessingState.statusMessage;
    }

    // If not in state, check if we have a current file being processed
    if (window.currentProcessingFile) {
      return Lang.get('ragProcessingFile', 'Processing file: {filename}').replace('{filename}', window.currentProcessingFile);
    }

    // Default status if none found
    return Lang.get('ragProcessingDocuments', 'Processing documents...');
  }

}

window.RAG = RAG;
window.generateEmbeddingForText = RAG.generateEmbedding.bind(RAG);
window.calculateCosineSimilarity = RAG.calculateCosineSimilarity.bind(RAG);
window.getChunkEmbedding = RAG.getChunkEmbedding.bind(RAG);
