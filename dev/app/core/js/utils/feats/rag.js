class RAG {
  static embeddingCapabilityCache = new Map();

  static async getMainDb(hashedMasterKey) {
    return PaiperworkDB.getDatabase(hashedMasterKey);
  }

  static async getRagDb(hashedMasterKey) {
    return PaiperworkDB.getDatabase(hashedMasterKey, 'rag', true);
  }

  static async ensureRagTables(ragDb, hashedMasterKey) {
    if (!ragDb) {
      return;
    }

    ragDb.exec(`
      CREATE TABLE IF NOT EXISTS document_chunks_${hashedMasterKey} (
        chunk_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        chunk_embedding TEXT,
        chunk_metadata TEXT,
        page_number INTEGER,
        section_title TEXT
      )
    `);
  }

  static async ensureIVFTables(ragDb, hashedMasterKey) {
    if (!ragDb) return;

    ragDb.exec(`
      CREATE TABLE IF NOT EXISTS embedding_clusters_${hashedMasterKey} (
        cluster_id INTEGER PRIMARY KEY,
        centroid TEXT NOT NULL
      )
    `);

    ragDb.exec(`
      CREATE TABLE IF NOT EXISTS chunk_cluster_map_${hashedMasterKey} (
        chunk_id TEXT PRIMARY KEY,
        cluster_id INTEGER NOT NULL
      )
    `);
  }


  // Document Management Methods

  // Processes an array of files (PDF or text), extracting content, chunking, embedding, and storing in the database.
  static async processDocuments(files, hashedMasterKey, progressCallback, model) {
   //console.log("RAG: Processing documents with model:", model);

    const supportsEmbeddings = await this.modelSupportsEmbeddings(model);
    if (supportsEmbeddings === false) {
      this.showEmbeddingWarning(model, "ingest");
      if (progressCallback) {
        progressCallback(
          null,
          `Selected model \"${model}\" does not support embeddings and cannot be used for document ingestion.`
        );
      }
      throw new Error(
        `Model ${model} does not support embeddings required for document ingestion`
      );
    }

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
        } else if (
          file.type === "text/plain" ||
          file.type === "text/markdown" ||
          String(file?.name || "").toLowerCase().endsWith(".md") ||
          String(file?.name || "").toLowerCase().endsWith(".txt")
        ) {
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
      progressCallback(0.95, "Building IVF search index for fast retrieval…");
    }

    // Build IVF index AFTER all documents are stored, so queries can use it immediately.
    try {
      await this.buildIVFIndex(hashedMasterKey);
    } catch (indexError) {
      console.warn("RAG: IVF index build failed (queries will fall back to hybrid search):", indexError);
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
                      // Reduce PDF.js worker noise while preserving error logs.
                      if (pdfjs.setVerbosityLevel && pdfjs.VerbosityLevel && typeof pdfjs.VerbosityLevel.ERRORS !== 'undefined') {
                        pdfjs.setVerbosityLevel(pdfjs.VerbosityLevel.ERRORS);
                      }
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
      const pdfLoadOptions = { data: arrayBuffer };
      if (pdfjsLib?.VerbosityLevel && typeof pdfjsLib.VerbosityLevel.ERRORS !== 'undefined') {
        pdfLoadOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS;
      }
      const pdf = await pdfjsLib.getDocument(pdfLoadOptions).promise;

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

      // Save document metadata in main DB and chunk embeddings in rag DB
      const db = await this.getMainDb(hashedMasterKey);
      const ragDb = await this.getRagDb(hashedMasterKey);
      await this.ensureRagTables(ragDb, hashedMasterKey);

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
          const normalizedParagraph = this.normalizeParagraphForChunking(paragraph);
          if (!normalizedParagraph) continue;

          // If adding this paragraph would make chunk too big, save current chunk
          if (
            currentChunk.length > 0 &&
            (currentChunk.length + normalizedParagraph.length > MAX_CHUNK_SIZE ||
              currentChunk.split(" ").length + normalizedParagraph.split(" ").length >
              350)
          ) {
            processChunks.push(currentChunk);
            currentChunk = "";
          }

          // Add paragraph to the current chunk
          if (currentChunk.length > 0) {
            currentChunk += "\n\n";
          }
          currentChunk += normalizedParagraph;

          // If we've reached a good chunk size and are at a natural break, save it
          if (
            currentChunk.length >= TARGET_CHUNK_SIZE &&
            normalizedParagraph.endsWith(".")
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
          ragDb.exec(`
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
      await PaiperworkDB.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');

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

    // Save document metadata in main DB and chunk embeddings in rag DB
    const db = await this.getMainDb(hashedMasterKey);
    const ragDb = await this.getRagDb(hashedMasterKey);
    await this.ensureRagTables(ragDb, hashedMasterKey);

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
      const normalizedParagraph = this.normalizeParagraphForChunking(paragraph);
      if (!normalizedParagraph) continue;

      // If adding this paragraph would make chunk too big, save current chunk
      if (
        currentChunk.length > 0 &&
        (currentChunk.length + normalizedParagraph.length > MAX_CHUNK_SIZE ||
          currentChunk.split(" ").length + normalizedParagraph.split(" ").length > 350)
      ) {
        processChunks.push(currentChunk);
        currentChunk = "";
      }

      // Add paragraph to the current chunk
      if (currentChunk.length > 0) {
        currentChunk += "\n\n";
      }
      currentChunk += normalizedParagraph;

      // If we've reached a good chunk size and are at a natural break, save it
      if (currentChunk.length >= TARGET_CHUNK_SIZE && normalizedParagraph.endsWith(".")) {
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
      ragDb.exec(`
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
    await PaiperworkDB.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');

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
      const db = await this.getMainDb(hashedMasterKey);
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
      const db = await this.getMainDb(hashedMasterKey);
      const ragDb = await this.getRagDb(hashedMasterKey);

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
        ragDb.exec(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='${chunkTableName}'
        `)[0]?.values.length > 0;

      // Delete from chunks table if it exists
      if (chunkTableExists) {
        ragDb.exec(
          `DELETE FROM ${chunkTableName} WHERE ${chunkIdCol} = '${documentId}'`
        );
      }

      // Delete document record
      db.exec(
        `DELETE FROM documents_${hashedMasterKey} WHERE ${docIdCol} = '${documentId}'`
      );

      // Save changes
      await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);
      if (chunkTableExists) {
        await PaiperworkDB.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');
      }
      return true;
    } catch (error) {
      console.error("RAG: Error deleting document:", error);
      return false;
    }
  }

  // Retrieves the most relevant document chunks for a user prompt.
  // Prefers IVF index when available; otherwise falls back to hybrid lexical+vector search.
  static async retrieveRelevantChunks(userPrompt, hashedMasterKey, limit = 5) {
    const modelSelector = document.getElementById("model-selector");
    const selectedModel = modelSelector.value;

    // Generate embedding for the user prompt
    const promptEmbedding = await this.generateEmbedding(
      userPrompt,
      selectedModel
    );

    const db = await this.getRagDb(hashedMasterKey);
    await this.ensureRagTables(db, hashedMasterKey);
    await this.ensureIVFTables(db, hashedMasterKey);

    // Prefer IVF index search; fall back to hybrid if no index exists.
    let topCandidates;
    const ivfReady = await this.hasIVFIndex(hashedMasterKey);
    if (ivfReady) {
      topCandidates = await this.findTopChunkCandidatesByIVF(
        db,
        hashedMasterKey,
        promptEmbedding,
        { limit, candidateMultiplier: 8, similarityThreshold: 0.3 }
      );
    } else {
      topCandidates = await this.findTopChunkCandidatesHybrid(
        db,
        hashedMasterKey,
        promptEmbedding,
        userPrompt,
        { limit, lexicalMultiplier: 40, lexicalMaxRowsToScan: 2000, similarityThreshold: 0.3 }
      );
    }

    if (!topCandidates.length) {
      return [];
    }

    const hydratedChunks = await this.hydrateChunkCandidates(
      db,
      hashedMasterKey,
      topCandidates,
      { includeDocumentName: false }
    );

    return hydratedChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((chunk) => ({
        chunkId: chunk.chunkId,
        docId: chunk.docId,
        text: chunk.text,
        metadata: chunk.metadata,
        similarity: chunk.similarity,
        pageNum: chunk.metadata?.page,
      }));
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

  static tokenizeQueryTerms(query) {
    if (!query || typeof query !== "string") {
      return [];
    }

    return Array.from(
      new Set(
        query
          .toLowerCase()
          .split(/[^\p{L}\p{N}]+/u)
          .map((term) => term.trim())
          .filter((term) => term.length >= 3)
      )
    );
  }

  static calculateLexicalSimilarity(text, query, terms) {
    if (!text || typeof text !== "string") {
      return 0;
    }

    const normalizedText = text.toLowerCase();
    if (!normalizedText.trim()) {
      return 0;
    }

    if (!Array.isArray(terms) || terms.length === 0) {
      return 0;
    }

    let matchedTerms = 0;
    let totalMatches = 0;

    for (const term of terms) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedTerm}\\b`, "g");
      const matches = normalizedText.match(regex);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        matchedTerms += 1;
        totalMatches += count;
      }
    }

    if (matchedTerms === 0) {
      return 0;
    }

    const coverage = matchedTerms / terms.length;
    const density = Math.min(totalMatches / Math.max(terms.length * 2, 6), 1);

    const phrase = (query || "").trim().toLowerCase();
    const phraseBoost = phrase.length > 5 && normalizedText.includes(phrase) ? 0.2 : 0;

    return Math.min(1, coverage * 0.65 + density * 0.35 + phraseBoost);
  }

  static async modelSupportsEmbeddings(model) {
    if (!model) {
      return null;
    }

    if (this.embeddingCapabilityCache.has(model)) {
      return this.embeddingCapabilityCache.get(model);
    }

    try {
      const routing = await OllamaAPI.getApiRoutingForModel(model);
      const response = await fetch(`${routing.baseUrl}/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...routing.headers },
        body: JSON.stringify({ model: routing.modelName || model, name: routing.modelName || model }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const capabilities = Array.isArray(data?.capabilities)
        ? data.capabilities.map((entry) => String(entry).toLowerCase())
        : [];

      const supportsEmbeddings = capabilities.includes("embedding") || capabilities.includes("embeddings");
      this.embeddingCapabilityCache.set(model, supportsEmbeddings);
      return supportsEmbeddings;
    } catch (_error) {
      return null;
    }
  }

  static addChunkCandidate(topCandidates, candidate, maxCandidates) {
    if (!candidate || typeof candidate.similarity !== "number") {
      return;
    }

    if (topCandidates.length < maxCandidates) {
      topCandidates.push(candidate);
      return;
    }

    let weakestIndex = 0;
    for (let i = 1; i < topCandidates.length; i++) {
      if (topCandidates[i].similarity < topCandidates[weakestIndex].similarity) {
        weakestIndex = i;
      }
    }

    if (candidate.similarity > topCandidates[weakestIndex].similarity) {
      topCandidates[weakestIndex] = candidate;
    }
  }

  static async findTopChunkCandidatesByEmbedding(
    db,
    hashedMasterKey,
    queryEmbedding,
    {
      limit = 5,
      candidateMultiplier = 8,
      similarityThreshold = 0.3,
      batchSize = 250,
      documentId = null,
      maxRowsToScan = Number.POSITIVE_INFINITY,
    } = {}
  ) {
    const maxCandidates = Math.max(limit * candidateMultiplier, limit);
    const topCandidates = [];

    let offset = 0;
    let scannedRows = 0;
    while (true) {
      const whereClause = documentId ? "WHERE document_id = ?" : "";
      const batchQuery = `
        SELECT chunk_id, document_id, chunk_embedding
        FROM document_chunks_${hashedMasterKey}
        ${whereClause}
        LIMIT ${batchSize} OFFSET ${offset}
      `;
      const batchParams = documentId ? [documentId] : [];
      const batchResult = db.exec(batchQuery, batchParams);
      const rows = batchResult?.[0]?.values || [];

      if (!rows.length) {
        break;
      }

      const remainingRowsBudget = Number.isFinite(maxRowsToScan)
        ? Math.max(maxRowsToScan - scannedRows, 0)
        : rows.length;
      if (remainingRowsBudget <= 0) {
        break;
      }

      const effectiveRows = Number.isFinite(maxRowsToScan)
        ? rows.slice(0, remainingRowsBudget)
        : rows;

      for (const [chunkId, docId, encEmbedding] of effectiveRows) {
        try {
          const embedding = JSON.parse(
            await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
          );
          if (!Array.isArray(embedding) || !embedding.length) {
            continue;
          }

          const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
          if (similarity < similarityThreshold) {
            continue;
          }

          this.addChunkCandidate(
            topCandidates,
            { chunkId, docId, similarity },
            maxCandidates
          );
        } catch (error) {
          console.error("RAG: Error processing chunk embedding candidate:", error);
        }
      }

      scannedRows += effectiveRows.length;
      if (Number.isFinite(maxRowsToScan) && scannedRows >= maxRowsToScan) {
        break;
      }

      offset += batchSize;
      if (rows.length < batchSize) {
        break;
      }
    }

    return topCandidates.sort((a, b) => b.similarity - a.similarity).slice(0, maxCandidates);
  }

  static async findTopChunkCandidatesByLexical(
    db,
    hashedMasterKey,
    query,
    {
      limit = 5,
      candidateMultiplier = 8,
      similarityThreshold = 0.2,
      batchSize = 120,
      documentId = null,
      maxRowsToScan = Number.POSITIVE_INFINITY,
    } = {}
  ) {
    const terms = this.tokenizeQueryTerms(query);
    if (!terms.length) {
      return [];
    }

    const maxCandidates = Math.max(limit * candidateMultiplier, limit);
    const topCandidates = [];

    let offset = 0;
    let scannedRows = 0;

    while (true) {
      const whereClause = documentId ? "WHERE document_id = ?" : "";
      const batchQuery = `
        SELECT chunk_id, document_id, chunk_text
        FROM document_chunks_${hashedMasterKey}
        ${whereClause}
        LIMIT ${batchSize} OFFSET ${offset}
      `;
      const batchParams = documentId ? [documentId] : [];
      const batchResult = db.exec(batchQuery, batchParams);
      const rows = batchResult?.[0]?.values || [];

      if (!rows.length) {
        break;
      }

      const remainingRowsBudget = Number.isFinite(maxRowsToScan)
        ? Math.max(maxRowsToScan - scannedRows, 0)
        : rows.length;
      if (remainingRowsBudget <= 0) {
        break;
      }

      const effectiveRows = Number.isFinite(maxRowsToScan)
        ? rows.slice(0, remainingRowsBudget)
        : rows;

      for (const [chunkId, docId, encText] of effectiveRows) {
        try {
          const text = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encText));
          const similarity = this.calculateLexicalSimilarity(text, query, terms);
          if (similarity < similarityThreshold) {
            continue;
          }

          this.addChunkCandidate(
            topCandidates,
            { chunkId, docId, similarity },
            maxCandidates
          );
        } catch (error) {
          console.error("RAG: Error processing lexical candidate:", error);
        }
      }

      scannedRows += effectiveRows.length;
      if (Number.isFinite(maxRowsToScan) && scannedRows >= maxRowsToScan) {
        break;
      }

      offset += batchSize;
      if (rows.length < batchSize) {
        break;
      }
    }

    return topCandidates.sort((a, b) => b.similarity - a.similarity).slice(0, maxCandidates);
  }

  // Hybrid retrieval: lexical pre-filter (capped scan) → vector re-rank on pre-filtered set.
  // Dramatically reduces expensive embedding-decrypt + cosine-similarity operations
  // by narrowing candidates to a small lexical pool before touching any embeddings.
  static async findTopChunkCandidatesHybrid(
    db,
    hashedMasterKey,
    queryEmbedding,
    query,
    {
      limit = 5,
      lexicalMultiplier = 40,
      lexicalMaxRowsToScan = 2000,
      similarityThreshold = 0.3,
      documentId = null,
    } = {}
  ) {
    // Phase 1: Fast lexical pre-filter with a capped row scan.
    // This avoids decrypting every embedding in the database.
    const lexicalCandidates = await this.findTopChunkCandidatesByLexical(
      db,
      hashedMasterKey,
      query,
      {
        limit: Math.max(limit * lexicalMultiplier, limit),
        candidateMultiplier: lexicalMultiplier,
        similarityThreshold: 0.1,
        batchSize: 180,
        documentId,
        maxRowsToScan: lexicalMaxRowsToScan,
      }
    );

    // If lexical found nothing, fall back to a bounded embedding scan.
    if (!lexicalCandidates.length) {
      return this.findTopChunkCandidatesByEmbedding(
        db,
        hashedMasterKey,
        queryEmbedding,
        {
          limit,
          candidateMultiplier: 8,
          similarityThreshold,
          batchSize: 200,
          documentId,
          maxRowsToScan: 1600,
        }
      );
    }

    // Phase 2: Vector re-rank — only decrypt embeddings for the lexical pool.
    const maxCandidates = Math.max(limit * 8, limit * 2);
    const topCandidates = [];

    // Batch-fetch encrypted embeddings for the lexical candidate chunk IDs.
    const chunkIds = lexicalCandidates.map((c) => c.chunkId);
    const placeholders = chunkIds.map(() => "?").join(",");
    const batchQuery = `
      SELECT chunk_id, document_id, chunk_embedding
      FROM document_chunks_${hashedMasterKey}
      WHERE chunk_id IN (${placeholders})
    `;
    const batchResult = db.exec(batchQuery, chunkIds);
    const rows = batchResult?.[0]?.values || [];

    for (const [chunkId, docId, encEmbedding] of rows) {
      try {
        const embedding = JSON.parse(
          await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
        );
        if (!Array.isArray(embedding) || !embedding.length) {
          continue;
        }

        const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
        if (similarity < similarityThreshold) {
          continue;
        }

        this.addChunkCandidate(
          topCandidates,
          { chunkId, docId, similarity },
          maxCandidates
        );
      } catch (error) {
        console.error("RAG: Error processing hybrid candidate:", error);
      }
    }

    // If vector re-rank produced nothing useful, return the lexical results as-is.
    if (!topCandidates.length) {
      return lexicalCandidates.slice(0, limit);
    }

    return topCandidates.sort((a, b) => b.similarity - a.similarity).slice(0, maxCandidates);
  }

  // ─── IVF (Inverted File) Index ───────────────────────────────────────────

  // Builds an IVF index over all chunk embeddings:
  // 1. Decrypts all embeddings from the database
  // 2. Runs k-means clustering to partition chunks into K clusters
  // 3. Stores centroids and chunk→cluster assignments in dedicated tables.
  // K = max(ceil(sqrt(N)), 4), capped at 256.
  static async buildIVFIndex(hashedMasterKey, progressCallback) {
    const ragDb = await this.getRagDb(hashedMasterKey);
    await this.ensureRagTables(ragDb, hashedMasterKey);
    await this.ensureIVFTables(ragDb, hashedMasterKey);

    // Phase 1: Collect all (chunkId, embedding) pairs.
    if (progressCallback) progressCallback(0.05, "Collecting embeddings for IVF index…");

    const vectors = [];  // { chunkId, embedding: Float32Array-like }
    let offset = 0;
    const batchSize = 300;

    while (true) {
      const result = ragDb.exec(`
        SELECT chunk_id, chunk_embedding
        FROM document_chunks_${hashedMasterKey}
        LIMIT ${batchSize} OFFSET ${offset}
      `);
      const rows = result?.[0]?.values || [];
      if (!rows.length) break;

      for (const [chunkId, encEmbedding] of rows) {
        try {
          const embedding = JSON.parse(
            await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
          );
          if (!Array.isArray(embedding) || !embedding.length) continue;
          vectors.push({ chunkId, embedding });
        } catch (error) {
          console.error("RAG IVF: Error decrypting embedding for chunk", chunkId, error);
        }
      }
      offset += batchSize;
    }

    const N = vectors.length;
    if (N < 4) {
      if (progressCallback) progressCallback(1, `Too few chunks (${N}) for IVF; skipped.`);
      return { clusters: 0, chunks: N };
    }

    // Phase 2: Determine K and run k-means.
    const K = Math.min(Math.max(Math.ceil(Math.sqrt(N)), 4), 256);
    const maxIterations = 20;

    if (progressCallback) progressCallback(0.15, `Clustering ${N} chunks into ${K} groups…`);

    const { centroids, assignments } = this.kMeans(vectors, K, maxIterations, (iterProgress) => {
      if (progressCallback) {
        progressCallback(0.15 + iterProgress * 0.65, `k-means iteration progress: ${Math.round(iterProgress * 100)}%`);
      }
    });

    // Phase 3: Store centroids and assignments.
    if (progressCallback) progressCallback(0.85, "Storing IVF index in database…");

    // Clear old index
    ragDb.exec(`DELETE FROM embedding_clusters_${hashedMasterKey}`);
    ragDb.exec(`DELETE FROM chunk_cluster_map_${hashedMasterKey}`);

    // Store centroids
    for (let c = 0; c < centroids.length; c++) {
      const encCentroid = JSON.stringify(
        await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(Array.from(centroids[c])))
      );
      ragDb.exec(`
        INSERT INTO embedding_clusters_${hashedMasterKey} (cluster_id, centroid)
        VALUES (${c}, '${encCentroid}')
      `);
    }

    // Store chunk→cluster mappings
    for (const { chunkId, clusterId } of assignments) {
      ragDb.exec(`
        INSERT INTO chunk_cluster_map_${hashedMasterKey} (chunk_id, cluster_id)
        VALUES ('${chunkId}', ${clusterId})
      `);
    }

    await PaiperworkDB.saveToStorage(ragDb.export(), hashedMasterKey, 'rag');

    if (progressCallback) progressCallback(1, `IVF index built: ${N} chunks in ${K} clusters.`);
    return { clusters: K, chunks: N };
  }

  // Standard k-means clustering. Returns { centroids: Float32Array[], assignments: {chunkId, clusterId}[] }.
  static kMeans(vectors, k, maxIterations = 20, iterationCallback) {
    const dim = vectors[0].embedding.length;
    const N = vectors.length;

    // Initialize centroids via k-means++ for better spread.
    const centroids = this.kMeansPlusPlusInit(vectors, k, dim);

    // Float32Array views for faster math.
    const vecs = vectors.map(v => new Float32Array(v.embedding));
    const cents = centroids.map(c => new Float32Array(c));

    const assignments = new Int32Array(N);
    let changed = true;
    let iter = 0;

    while (changed && iter < maxIterations) {
      changed = false;

      // Assign each vector to the nearest centroid.
      for (let i = 0; i < N; i++) {
        let bestDist = Infinity;
        let bestCluster = 0;
        const vec = vecs[i];
        for (let c = 0; c < k; c++) {
          const dist = this.euclideanDistanceSquared(vec, cents[c]);
          if (dist < bestDist) {
            bestDist = dist;
            bestCluster = c;
          }
        }
        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Recompute centroids as mean of assigned vectors.
      const sums = Array.from({ length: k }, () => new Float64Array(dim));
      const counts = new Int32Array(k);

      for (let i = 0; i < N; i++) {
        const c = assignments[i];
        counts[c]++;
        const sum = sums[c];
        const vec = vecs[i];
        for (let d = 0; d < dim; d++) {
          sum[d] += vec[d];
        }
      }

      for (let c = 0; c < k; c++) {
        if (counts[c] > 0) {
          const invCount = 1 / counts[c];
          const sum = sums[c];
          for (let d = 0; d < dim; d++) {
            cents[c][d] = sum[d] * invCount;
          }
        }
      }

      iter++;
      if (iterationCallback) iterationCallback(iter / maxIterations);
    }

    const finalAssignments = [];
    for (let i = 0; i < N; i++) {
      finalAssignments.push({ chunkId: vectors[i].chunkId, clusterId: assignments[i] });
    }

    return { centroids: cents, assignments: finalAssignments };
  }

  // k-means++ centroid initialization for better convergence and spread.
  static kMeansPlusPlusInit(vectors, k, dim) {
    const N = vectors.length;
    const centroids = [];
    const vecs = vectors.map(v => new Float32Array(v.embedding));

    // First centroid: random.
    centroids.push(new Float32Array(vecs[Math.floor(Math.random() * N)]));

    // Subsequent centroids: probability proportional to squared distance from nearest existing centroid.
    for (let c = 1; c < k; c++) {
      const distances = new Float64Array(N);
      let totalDist = 0;

      for (let i = 0; i < N; i++) {
        let minDist = Infinity;
        for (const cent of centroids) {
          const d = this.euclideanDistanceSquared(vecs[i], cent);
          if (d < minDist) minDist = d;
        }
        distances[i] = minDist;
        totalDist += minDist;
      }

      if (totalDist === 0) {
        // All remaining points identical to existing centroids; duplicate the last one.
        centroids.push(new Float32Array(centroids[centroids.length - 1]));
        continue;
      }

      let r = Math.random() * totalDist;
      let chosen = 0;
      for (let i = 0; i < N; i++) {
        r -= distances[i];
        if (r <= 0) {
          chosen = i;
          break;
        }
      }
      centroids.push(new Float32Array(vecs[chosen]));
    }

    return centroids;
  }

  // Squared Euclidean distance (faster than sqrt for comparisons).
  static euclideanDistanceSquared(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return sum;
  }

  // IVF-based search: finds nearest M centroids, then only scans chunks in those clusters.
  static async findTopChunkCandidatesByIVF(
    db,
    hashedMasterKey,
    queryEmbedding,
    {
      limit = 5,
      candidateMultiplier = 8,
      similarityThreshold = 0.3,
      documentId = null,
    } = {}
  ) {
    // Phase 1: Load centroids and find the nearest M clusters.
    const centroidsResult = db.exec(`
      SELECT cluster_id, centroid FROM embedding_clusters_${hashedMasterKey}
    `);
    const centroidRows = centroidsResult?.[0]?.values || [];

    if (!centroidRows.length) {
      // No IVF index built yet; fall back to bounded embedding scan.
      return this.findTopChunkCandidatesByEmbedding(db, hashedMasterKey, queryEmbedding, {
        limit,
        candidateMultiplier,
        similarityThreshold,
        batchSize: 200,
        documentId,
        maxRowsToScan: 1600,
      });
    }

    const qVec = new Float32Array(queryEmbedding);
    const K = centroidRows.length;
    const M = Math.max(Math.min(Math.ceil(K / 4), 8), 2); // search nearest 25% of clusters, min 2, max 8

    // Compute distance to each centroid.
    const centroidDistances = [];
    for (const [clusterId, encCentroid] of centroidRows) {
      try {
        const centroidArr = JSON.parse(
          await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encCentroid))
        );
        if (!Array.isArray(centroidArr) || !centroidArr.length) continue;
        const dist = this.euclideanDistanceSquared(qVec, new Float32Array(centroidArr));
        centroidDistances.push({ clusterId, dist });
      } catch (error) {
        console.error("RAG IVF: Error decrypting centroid", clusterId, error);
      }
    }

    centroidDistances.sort((a, b) => a.dist - b.dist);
    const nearestClusters = centroidDistances.slice(0, M).map(c => c.clusterId);

    if (!nearestClusters.length) {
      return [];
    }

    // Phase 2: Fetch chunk IDs from the nearest clusters.
    const clusterPlaceholders = nearestClusters.map(() => "?").join(",");
    const mapQuery = `
      SELECT chunk_id FROM chunk_cluster_map_${hashedMasterKey}
      WHERE cluster_id IN (${clusterPlaceholders})
    `;
    const mapResult = db.exec(mapQuery, nearestClusters);
    const chunkIdRows = mapResult?.[0]?.values || [];

    if (!chunkIdRows.length) {
      return [];
    }

    const candidateChunkIds = chunkIdRows.map(([id]) => id);

    // Phase 3: Fetch embeddings only for candidate chunks and compute cosine similarity.
    const maxCandidates = Math.max(limit * candidateMultiplier, limit * 2);
    const topCandidates = [];

    // Process in batches to avoid giant SQL IN clauses.
    const fetchBatchSize = 200;
    for (let i = 0; i < candidateChunkIds.length; i += fetchBatchSize) {
      const batch = candidateChunkIds.slice(i, i + fetchBatchSize);
      const placeholders = batch.map(() => "?").join(",");

      let embedQuery = `
        SELECT chunk_id, document_id, chunk_embedding
        FROM document_chunks_${hashedMasterKey}
        WHERE chunk_id IN (${placeholders})
      `;
      const embedParams = [...batch];

      if (documentId) {
        embedQuery += " AND document_id = ?";
        embedParams.push(documentId);
      }

      const embedResult = db.exec(embedQuery, embedParams);
      const embedRows = embedResult?.[0]?.values || [];

      for (const [chunkId, docId, encEmbedding] of embedRows) {
        try {
          const embedding = JSON.parse(
            await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encEmbedding))
          );
          if (!Array.isArray(embedding) || !embedding.length) continue;

          const similarity = this.calculateCosineSimilarity(queryEmbedding, embedding);
          if (similarity < similarityThreshold) continue;

          this.addChunkCandidate(
            topCandidates,
            { chunkId, docId, similarity },
            maxCandidates
          );
        } catch (error) {
          console.error("RAG IVF: Error processing candidate", error);
        }
      }
    }

    return topCandidates.sort((a, b) => b.similarity - a.similarity).slice(0, maxCandidates);
  }

  // Checks whether an IVF index exists for the current master key.
  // If chunks exist but no index, lazily triggers a background index build.
  static _ivfBuildInProgress = new Map();

  static async hasIVFIndex(hashedMasterKey) {
    try {
      const ragDb = await this.getRagDb(hashedMasterKey);
      const result = ragDb.exec(`
        SELECT COUNT(*) FROM embedding_clusters_${hashedMasterKey}
      `);
      const count = result?.[0]?.values?.[0]?.[0] || 0;
      if (count > 0) return true;

      // No index yet — check if there are chunks worth indexing.
      if (this._ivfBuildInProgress.get(hashedMasterKey)) return false;

      const chunkResult = ragDb.exec(`
        SELECT COUNT(*) FROM document_chunks_${hashedMasterKey}
      `);
      const chunkCount = chunkResult?.[0]?.values?.[0]?.[0] || 0;

      if (chunkCount >= 4) {
        // Fire-and-forget background build. Queries use hybrid until it completes.
        this._ivfBuildInProgress.set(hashedMasterKey, true);
        this.buildIVFIndex(hashedMasterKey)
          .catch(err => console.warn("RAG: Lazy IVF index build failed", err))
          .finally(() => this._ivfBuildInProgress.delete(hashedMasterKey));
      }

      return false;
    } catch (_error) {
      return false;
    }
  }

  static async hydrateChunkCandidates(
    db,
    hashedMasterKey,
    candidates,
    { includeDocumentName = false, documentsDb = null } = {}
  ) {
    if (!Array.isArray(candidates) || !candidates.length) {
      return [];
    }

    const placeholders = candidates.map(() => "?").join(",");
    const chunkIds = candidates.map((candidate) => candidate.chunkId);
    const chunksQuery = `
      SELECT chunk_id, document_id, chunk_text, chunk_metadata
      FROM document_chunks_${hashedMasterKey}
      WHERE chunk_id IN (${placeholders})
    `;

    const chunksResult = db.exec(chunksQuery, chunkIds);
    const rows = chunksResult?.[0]?.values || [];
    if (!rows.length) {
      return [];
    }

    const candidateByChunkId = new Map(
      candidates.map((candidate) => [candidate.chunkId, candidate])
    );

    const docNameMap = {};
    if (includeDocumentName) {
      const docsDb = documentsDb || db;
      const docIds = Array.from(new Set(candidates.map((candidate) => candidate.docId).filter(Boolean)));
      if (docIds.length > 0) {
        const docPlaceholders = docIds.map(() => "?").join(",");
        const docsQuery = `
          SELECT document_id, document_name
          FROM documents_${hashedMasterKey}
          WHERE document_id IN (${docPlaceholders})
        `;
        const docsResult = docsDb.exec(docsQuery, docIds);
        const docRows = docsResult?.[0]?.values || [];
        for (const [docId, encName] of docRows) {
          try {
            docNameMap[docId] = await PaiperworkDB.decrypt(
              hashedMasterKey,
              JSON.parse(encName)
            );
          } catch (_error) {
            docNameMap[docId] = "Unknown Document";
          }
        }
      }
    }

    const hydrated = [];
    for (const [chunkId, docId, encText, encMetadata] of rows) {
      const candidate = candidateByChunkId.get(chunkId);
      if (!candidate) {
        continue;
      }

      try {
        const text = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encText));
        let metadata = {};
        try {
          metadata = JSON.parse(
            await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata))
          );
        } catch (_error) {
          metadata = {};
        }

        hydrated.push({
          chunkId,
          docId,
          text,
          metadata,
          similarity: candidate.similarity,
          documentName: includeDocumentName ? (docNameMap[docId] || "Unknown Document") : undefined,
        });
      } catch (error) {
        console.error("RAG: Error hydrating chunk candidate:", error);
      }
    }

    return hydrated;
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

      const routing = await OllamaAPI.getApiRoutingForModel(model);
      const routedModelName = routing.modelName || model;
      const endpointConfigs = [
        {
          url: `${routing.baseUrl}/embed`,
          createBody: (inputText, options) => ({ model: routedModelName, input: inputText, options }),
        },
        {
          url: `${routing.baseUrl}/embeddings`,
          createBody: (inputText, options) => ({ model: routedModelName, prompt: inputText, options }),
        },
      ];

      const endpointFallbackStatuses = new Set([404, 405, 501]);

      const requestEmbedding = async (inputText, options) => {
        let lastError = null;

        for (let i = 0; i < endpointConfigs.length; i++) {
          const endpoint = endpointConfigs[i];
          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...routing.headers },
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
  static showEmbeddingWarning(modelName, mode = "general") {
   //console.log(`Showing embedding warning for model: ${modelName}`);

    // First remove any existing warnings
    const existingWarnings = document.querySelectorAll('.embedding-warning-notification');
    existingWarnings.forEach(el => el.remove());

    const isIngestMode = mode === "ingest";
    const safeModelName = String(modelName || '');
    const titleText = isIngestMode
      ? Lang.get(
        'ragIngestModelNotCompatibleTitle',
        'Model Not Compatible with Document Ingestion'
      )
      : Lang.get('ragModelNotCompatibleTitle', 'Model Not Compatible with Document Search');
    const messageTemplate = isIngestMode
      ? Lang.get(
        'ragIngestModelNotCompatibleMessage',
        'The model <strong>{model}</strong> cannot be used to ingest documents because it does not support embeddings.'
      )
      : Lang.get('ragModelNotCompatibleMessage', 'The model <strong>{model}</strong> doesn\'t support embeddings, which are required for document search and RAG functionality.');
    const suggestionText = isIngestMode
      ? Lang.get(
        'ragIngestModelSelectCompatible',
        'Please select a model specifically designed for embeddings/document ingest (for example embedding models) and try again.'
      )
      : Lang.get('ragModelSelectCompatible', 'Please select a model that supports embeddings (such as nomic-embed-text, llama3, mistral or mixtral models).');

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

    const header = document.createElement('h3');
    header.style.cssText = 'margin-top: 0; margin-bottom: 10px; font-size: 18px; display: flex; align-items: center;';

    const icon = document.createElement('span');
    icon.style.cssText = 'margin-right: 8px; font-size: 20px;';
    icon.textContent = '⚠️';
    header.appendChild(icon);
    header.appendChild(document.createTextNode(` ${titleText}`));

    const message = document.createElement('p');
    message.style.cssText = 'margin-bottom: 12px; font-size: 15px;';

    const messageTemplateWithoutTags = messageTemplate.replace(/<\/?strong>/gi, '');
    if (messageTemplateWithoutTags.includes('{model}')) {
      const parts = messageTemplateWithoutTags.split('{model}');
      message.appendChild(document.createTextNode(parts[0] || ''));
      const modelStrong = document.createElement('strong');
      modelStrong.textContent = safeModelName;
      message.appendChild(modelStrong);
      message.appendChild(document.createTextNode(parts.slice(1).join('{model}')));
    } else {
      message.textContent = messageTemplateWithoutTags;
    }

    const suggestion = document.createElement('p');
    suggestion.style.cssText = 'margin-bottom: 16px; font-size: 15px;';
    suggestion.textContent = suggestionText;

    const footer = document.createElement('div');
    footer.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const link = document.createElement('a');
    link.href = 'https://ollama.com/search?q=&sort=downloads&filter=embedding';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'color: #4F46E5; text-decoration: underline; font-weight: 600;';
    link.textContent = Lang.get('ragFindEmbeddingModels', 'Find embedding-capable models');

    const closeButton = document.createElement('button');
    closeButton.style.cssText = 'background: #DC2626; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;';
    closeButton.textContent = Lang.get('ragIUnderstand', 'I Understand');

    footer.appendChild(link);
    footer.appendChild(closeButton);

    notification.appendChild(header);
    notification.appendChild(message);
    notification.appendChild(suggestion);
    notification.appendChild(footer);

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
    closeButton.addEventListener('click', () => {
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

  // Searches all document chunks. Prefers IVF index when available;
  // otherwise falls back to hybrid lexical+vector or pure lexical.
  static async searchDocuments(query, hashedMasterKey, model) {
   //console.log(`Searching documents for: "${query}" using model: ${model}`);

    if (!query || !hashedMasterKey) {
      throw new Error("Search query and masterkey are required");
    }

    try {
      const db = await this.getRagDb(hashedMasterKey);
      await this.ensureRagTables(db, hashedMasterKey);
      await this.ensureIVFTables(db, hashedMasterKey);
      const docsDb = await this.getMainDb(hashedMasterKey);

      let topCandidates = [];
      let usedLexicalFallback = false;

      const supportsEmbeddings = await this.modelSupportsEmbeddings(model);
      if (supportsEmbeddings === false) {
        // Model can't embed — pure lexical with capped scan.
        usedLexicalFallback = true;
        topCandidates = await this.findTopChunkCandidatesByLexical(
          db, hashedMasterKey, query,
          { limit: 5, candidateMultiplier: 10, similarityThreshold: 0.2, batchSize: 120, maxRowsToScan: 1800 }
        );
      } else {
        try {
          const queryEmbedding = await this.generateEmbedding(query, model);
          if (!queryEmbedding || !queryEmbedding.length) {
            throw new Error("Could not generate embedding for search query");
          }

          // Prefer IVF index when available; hybrid lexical+vector otherwise.
          const ivfReady = await this.hasIVFIndex(hashedMasterKey);
          if (ivfReady) {
            topCandidates = await this.findTopChunkCandidatesByIVF(
              db, hashedMasterKey, queryEmbedding,
              { limit: 5, candidateMultiplier: 8, similarityThreshold: 0 }
            );
          } else {
            topCandidates = await this.findTopChunkCandidatesHybrid(
              db, hashedMasterKey, queryEmbedding, query,
              { limit: 5, lexicalMultiplier: 40, lexicalMaxRowsToScan: 2000, similarityThreshold: 0 }
            );
          }
        } catch (error) {
          console.warn("RAG: Embedding retrieval unavailable, using lexical fallback", error);
          usedLexicalFallback = true;
          topCandidates = await this.findTopChunkCandidatesByLexical(
            db, hashedMasterKey, query,
            { limit: 5, candidateMultiplier: 10, similarityThreshold: 0.2, batchSize: 120, maxRowsToScan: 1800 }
          );
        }
      }

      if (!topCandidates.length) {
        return [];
      }

      const chunks = await this.hydrateChunkCandidates(
        db,
        hashedMasterKey,
        topCandidates,
        { includeDocumentName: true, documentsDb: docsDb }
      );

      const normalizedChunks = chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.docId,
        documentName: chunk.documentName || "Unknown Document",
        text: chunk.text,
        similarity: typeof chunk.similarity === "number" ? chunk.similarity : 0,
      }));

      // If vector search failed to find good matches, try a simple text-based re-score
      const hasGoodMatches = normalizedChunks.some((chunk) => chunk.similarity > 0.5);

      if (!hasGoodMatches && normalizedChunks.length > 0 && !usedLexicalFallback) {
       //console.log("No good embedding matches, applying lexical re-score");
        const terms = query
          .toLowerCase()
          .split(/\s+/)
          .filter((term) => term.length > 2);

        normalizedChunks.forEach((chunk) => {
          const text = chunk.text.toLowerCase();
          let textScore = 0;

          terms.forEach((term) => {
            const count = (text.match(new RegExp(term, "g")) || []).length;
            textScore += count * 0.1;
          });

          chunk.similarity = Math.max(chunk.similarity, textScore);
        });
      }

      normalizedChunks.sort((a, b) => b.similarity - a.similarity);
      return normalizedChunks.slice(0, 5);
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
      const db = await this.getMainDb(hashedMasterKey);
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
  return await this.getMainDb(hashedMasterKey);
  }

  static shouldPreserveShortParagraph(paragraph) {
    const text = String(paragraph || "").trim();
    if (!text) {
      return false;
    }

    if (text.length >= 20) {
      return true;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 2) {
      return false;
    }

    return (
      /^[\u2022\u2023\u25E6\u2043\-*+]/.test(text) ||
      /^\(?\d+[.):-]?\s+/.test(text) ||
      /^\d+\s*[x×-]\s+/i.test(text) ||
      /\b(usb|cable|charger|adapter|battery|speaker|bluetooth|wifi|warranty|included|box)\b/i.test(text) ||
      /[:;,-]/.test(text) ||
      wordCount >= 3
    );
  }

  static normalizeParagraphForChunking(paragraph) {
    const text = String(paragraph || "").trim();
    if (!text) {
      return "";
    }

    if (text.length >= 20 || this.shouldPreserveShortParagraph(text)) {
      return text;
    }

    return "";
  }
  // Searches document chunks with additional constraints (e.g., by document ID), using embeddings.
  static async searchDocumentsWithConstraint(query, hashedMasterKey, model, constraints) {
   //console.log("RAG: Searching documents with constraints:", constraints);

    if (!hashedMasterKey || !constraints) {
      console.error("RAG: Missing required parameters for searchDocumentsWithConstraint");
      return [];
    }

    try {
      const db = await this.getRagDb(hashedMasterKey);
      await this.ensureRagTables(db, hashedMasterKey);
      await this.ensureIVFTables(db, hashedMasterKey);
      const docsDb = await this.getMainDb(hashedMasterKey);
      if (!db || !docsDb) {
        throw new Error("Database not available");
      }

      // Build WHERE clause based on constraints
      let whereClause = "";
      let whereParams = [];

      if (constraints && constraints.documentId) {
        whereClause = "WHERE document_id = ?";
        whereParams = [constraints.documentId];
      }

      // Determine practical chunk cap for lightweight fallback hydration
      const countQuery = `
        SELECT COUNT(*)
        FROM document_chunks_${hashedMasterKey}
        ${whereClause}
      `;
      const countResult = db.exec(countQuery, whereParams);
      const chunkCount = countResult?.[0]?.values?.[0]?.[0] || 0;

      let chunkLimit = 30;
      if (chunkCount > 200) {
        chunkLimit = 20;
      } else if (chunkCount < 50) {
        chunkLimit = chunkCount;
      }

      const fallbackQuery = `
        SELECT chunk_id, document_id
        FROM document_chunks_${hashedMasterKey}
        ${whereClause}
        LIMIT ${chunkLimit}
      `;
      const fallbackResult = db.exec(fallbackQuery, whereParams);
      const fallbackRows = fallbackResult?.[0]?.values || [];
      const fallbackCandidates = fallbackRows.map(([chunkId, docId]) => ({
        chunkId,
        docId,
        similarity: 0,
      }));

      if (!query || !query.trim()) {
        const fallbackChunks = await this.hydrateChunkCandidates(
          db,
          hashedMasterKey,
          fallbackCandidates,
          { includeDocumentName: true, documentsDb: docsDb }
        );

        return fallbackChunks.map((chunk) => ({
          id: chunk.chunkId,
          documentId: chunk.docId,
          documentName: chunk.documentName || "Unknown Document",
          text: chunk.text,
          similarity: typeof chunk.similarity === "number" ? chunk.similarity : 0,
        }));
      }

      let topCandidates = [];
      let usedLexicalFallback = false;
      const maxRowsToScan = constraints?.documentId
        ? Math.min(Math.max(chunkLimit * 30, 400), 1600)
        : 1400;

      const supportsEmbeddings = await this.modelSupportsEmbeddings(model);
      if (supportsEmbeddings === false) {
        // Model can't embed — pure lexical with capped scan.
        usedLexicalFallback = true;
        topCandidates = await this.findTopChunkCandidatesByLexical(
          db,
          hashedMasterKey,
          query,
          {
            limit: 5,
            candidateMultiplier: 8,
            similarityThreshold: 0.2,
            batchSize: 100,
            documentId: constraints?.documentId || null,
            maxRowsToScan,
          }
        );
      } else {
        try {
          const queryEmbedding = await this.generateEmbedding(query, model);
          if (!queryEmbedding) {
            throw new Error("Failed to generate embedding for query");
          }

          // Prefer IVF index when available; hybrid lexical+vector otherwise.
          const ivfReady = await this.hasIVFIndex(hashedMasterKey);
          if (ivfReady) {
            topCandidates = await this.findTopChunkCandidatesByIVF(
              db,
              hashedMasterKey,
              queryEmbedding,
              {
                limit: 5,
                candidateMultiplier: 8,
                similarityThreshold: 0.3,
                documentId: constraints?.documentId || null,
              }
            );
          } else {
            topCandidates = await this.findTopChunkCandidatesHybrid(
              db,
              hashedMasterKey,
              queryEmbedding,
              query,
              {
                limit: 5,
                lexicalMultiplier: 40,
                lexicalMaxRowsToScan: maxRowsToScan,
                similarityThreshold: 0.3,
                documentId: constraints?.documentId || null,
              }
            );
          }
        } catch (error) {
          console.warn("RAG: Falling back to lexical retrieval for constrained search", error);
          usedLexicalFallback = true;
          topCandidates = await this.findTopChunkCandidatesByLexical(
            db,
            hashedMasterKey,
            query,
            {
              limit: 5,
              candidateMultiplier: 8,
              similarityThreshold: 0.2,
              batchSize: 100,
              documentId: constraints?.documentId || null,
              maxRowsToScan,
            }
          );
        }
      }

      if (!topCandidates.length && query && !usedLexicalFallback) {
        // Final fallback: pure lexical with relaxed threshold.
        topCandidates = await this.findTopChunkCandidatesByLexical(
          db,
          hashedMasterKey,
          query,
          {
            limit: 5,
            candidateMultiplier: 10,
            similarityThreshold: 0.1,
            batchSize: 120,
            documentId: constraints?.documentId || null,
            maxRowsToScan,
          }
        );
        usedLexicalFallback = topCandidates.length > 0;
      }

      if (!topCandidates.length) {
        const fallbackChunks = await this.hydrateChunkCandidates(
          db,
          hashedMasterKey,
          fallbackCandidates.slice(0, 3),
          { includeDocumentName: true, documentsDb: docsDb }
        );

        return fallbackChunks.map((chunk) => ({
          id: chunk.chunkId,
          documentId: chunk.docId,
          documentName: chunk.documentName || "Unknown Document",
          text: chunk.text,
          similarity: typeof chunk.similarity === "number" ? chunk.similarity : 0,
        }));
      }

      const hydratedResults = await this.hydrateChunkCandidates(
        db,
        hashedMasterKey,
        topCandidates,
        { includeDocumentName: true, documentsDb: docsDb }
      );

      let normalizedResults = hydratedResults
        .map((chunk) => ({
          id: chunk.chunkId,
          documentId: chunk.docId,
          documentName: chunk.documentName || "Unknown Document",
          text: chunk.text,
          similarity: typeof chunk.similarity === "number" ? chunk.similarity : 0,
        }));

      const hasGoodMatches = normalizedResults.some((chunk) => chunk.similarity > 0.5);
      if (!hasGoodMatches && normalizedResults.length > 0 && !usedLexicalFallback) {
        const lexicalCandidates = await this.findTopChunkCandidatesByLexical(
          db,
          hashedMasterKey,
          query,
          {
            limit: 5,
            candidateMultiplier: 10,
            similarityThreshold: 0.1,
            batchSize: 120,
            documentId: constraints?.documentId || null,
            maxRowsToScan,
          }
        );

        if (lexicalCandidates.length > 0) {
          const lexicalResults = await this.hydrateChunkCandidates(
            db,
            hashedMasterKey,
            lexicalCandidates,
            { includeDocumentName: true, documentsDb: docsDb }
          );

          normalizedResults = lexicalResults.map((chunk) => ({
            id: chunk.chunkId,
            documentId: chunk.docId,
            documentName: chunk.documentName || "Unknown Document",
            text: chunk.text,
            similarity: typeof chunk.similarity === "number" ? chunk.similarity : 0,
          }));
        } else {
          const terms = this.tokenizeQueryTerms(query);

          normalizedResults.forEach((chunk) => {
            const textScore = this.calculateLexicalSimilarity(chunk.text, query, terms);
            chunk.similarity = Math.max(chunk.similarity, textScore);
          });
        }
      }

      normalizedResults.sort((a, b) => b.similarity - a.similarity);

      return normalizedResults.slice(0, 5);
    } catch (error) {
      console.error("RAG: Error in searchDocumentsWithConstraint:", error);
      return [];
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
