// Class for generating and managing different types of documents
class DocumentGenerator {
    constructor(paperworkInstance) {
        this.paperwork = paperworkInstance;
        this.documentContent = null;
    }

    // Initializes the DocumentGenerator instance
    async initialize() {
        // Initialization if needed
        //console.log('DocumentGenerator: Initializing');
    }

    // Returns HTML fields for a business letter form
    getBusinessLetterFields() {
        return `
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorLocationLabel')}</label>
            <input type="text" class="paperwork-input" id="location-info" placeholder="${Lang.get('documentGeneratorLocationPlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorDateLabel')}</label>
            <input type="date" class="paperwork-input" id="letter-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorRecipientLabel')}</label>
            <input type="text" class="paperwork-input" id="recipient-info" placeholder="${Lang.get('documentGeneratorRecipientPlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorSubjectLabel')}</label>
            <input type="text" class="paperwork-input" id="letter-subject" placeholder="${Lang.get('documentGeneratorSubjectPlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
             <label class="paperwork-label">${Lang.get('documentGeneratorGreetingLabel')}</label>
             <input type="text" class="paperwork-input" id="letter-greeting" placeholder="${Lang.get('documentGeneratorGreetingPlaceholder')}" value="${Lang.get('documentGeneratorGreetingDefault1')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorBodyLabel')}</label>
            <textarea class="paperwork-textarea" id="letter-body" placeholder="${Lang.get('documentGeneratorBodyPlaceholder')}" rows="8"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorToneLabel')}</label>
            <select class="paperwork-select" id="letter-tone">
            <option value="professional">${Lang.get('documentGeneratorToneProfessional')}</option>
            <option value="friendly">${Lang.get('documentGeneratorToneFriendly')}</option>
            <option value="formal">${Lang.get('documentGeneratorToneFormal')}</option>
            <option value="urgent">${Lang.get('documentGeneratorToneUrgent')}</option>
            <option value="persuasive">${Lang.get('documentGeneratorTonePersuasive')}</option>
            <option value="apologetic">${Lang.get('documentGeneratorToneApologetic')}</option>
            <option value="appreciative">${Lang.get('documentGeneratorToneAppreciative')}</option>
            <option value="direct">${Lang.get('documentGeneratorToneDirect')}</option>
            </select>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorClosingLabel')}</label>
            <input type="text" class="paperwork-input" id="letter-closing" placeholder="${Lang.get('documentGeneratorClosingPlaceholder')}" value="${Lang.get('documentGeneratorClosingDefault')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorSignatureLabel')}</label>
            <input type="text" class="paperwork-input" id="letter-signature" placeholder="${Lang.get('documentGeneratorSignaturePlaceholder')}">
        </div>
    `;
    }

    // Returns HTML fields for a contract form
    getContractFields() {
        return `
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorContractTypeLabel')}</label>
                <select class="paperwork-select" id="contract-type">
                    <option value="service">${Lang.get('documentGeneratorContractTypeService')}</option>
                    <option value="employment">${Lang.get('documentGeneratorContractTypeEmployment')}</option>
                    <option value="nda">${Lang.get('documentGeneratorContractTypeNDA')}</option>
                    <option value="sale">${Lang.get('documentGeneratorContractTypeSale')}</option>
                    <option value="lease">${Lang.get('documentGeneratorContractTypeLease')}</option>
                    <option value="consulting">${Lang.get('documentGeneratorContractTypeConsulting')}</option>
                    <option value="partnership">${Lang.get('documentGeneratorContractTypePartnership')}</option>
                    <option value="custom">${Lang.get('documentGeneratorContractTypeCustom')}</option>
                </select>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorContractTitleLabel')}</label>
                <input type="text" class="paperwork-input" id="contract-title" placeholder="${Lang.get('documentGeneratorContractTitlePlaceholder')}">
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorParty1Label')}</label>
                <textarea class="paperwork-textarea" id="party1-info" placeholder="${Lang.get('documentGeneratorParty1Placeholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorParty2Label')}</label>
                <textarea class="paperwork-textarea" id="party2-info" placeholder="${Lang.get('documentGeneratorParty2Placeholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorEffectiveDateLabel')}</label>
                <input type="date" class="paperwork-input" id="contract-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorTermLabel')}</label>
                <input type="text" class="paperwork-input" id="contract-term" placeholder="${Lang.get('documentGeneratorTermPlaceholder')}">
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorScopeLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-scope" placeholder="${Lang.get('documentGeneratorScopePlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorPaymentLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-payment" placeholder="${Lang.get('documentGeneratorPaymentPlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorConfidentialityLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-confidentiality" placeholder="${Lang.get('documentGeneratorConfidentialityPlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorIPLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-ip" placeholder="${Lang.get('documentGeneratorIPPlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorTerminationLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-termination" placeholder="${Lang.get('documentGeneratorTerminationPlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorDisputeLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-disputes" placeholder="${Lang.get('documentGeneratorDisputePlaceholder')}"></textarea>
            </div>
            
            <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
                <label class="paperwork-label">${Lang.get('documentGeneratorAdditionalTermsLabel')}</label>
                <textarea class="paperwork-textarea" id="contract-terms" placeholder="${Lang.get('documentGeneratorAdditionalTermsPlaceholder')}"></textarea>
            </div>
        `;
    }

    // Returns HTML fields for a proposal form
    getProposalFields() {
        return `
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalCompanyLabel')}</label>
            <textarea class="paperwork-textarea" id="company-info" placeholder="${Lang.get('documentGeneratorProposalCompanyPlaceholder')}"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalClientLabel')}</label>
            <textarea class="paperwork-textarea" id="client-info" placeholder="${Lang.get('documentGeneratorProposalClientPlaceholder')}"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalTitleLabel')}</label>
            <input type="text" class="paperwork-input" id="proposal-title" placeholder="${Lang.get('documentGeneratorProposalTitlePlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalTypeLabel')}</label>
            <select class="paperwork-select" id="proposal-type">
                <option value="services">${Lang.get('documentGeneratorProposalTypeServices')}</option>
                <option value="product">${Lang.get('documentGeneratorProposalTypeProduct')}</option>
                <option value="project">${Lang.get('documentGeneratorProposalTypeProject')}</option>
                <option value="investment">${Lang.get('documentGeneratorProposalTypeInvestment')}</option>
                <option value="partnership">${Lang.get('documentGeneratorProposalTypePartnership')}</option>
                <option value="marketing">${Lang.get('documentGeneratorProposalTypeMarketing')}</option>
                <option value="consulting">${Lang.get('documentGeneratorProposalTypeConsulting')}</option>
                <option value="custom">${Lang.get('documentGeneratorProposalTypeCustom')}</option>
            </select>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalSummaryLabel')}</label>
            <textarea class="paperwork-textarea" id="proposal-summary" placeholder="${Lang.get('documentGeneratorProposalSummaryPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalProblemLabel')}</label>
            <textarea class="paperwork-textarea" id="problem-statement" placeholder="${Lang.get('documentGeneratorProposalProblemPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalSolutionLabel')}</label>
            <textarea class="paperwork-textarea" id="proposed-solution" placeholder="${Lang.get('documentGeneratorProposalSolutionPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorDeliverablesLabel')}</label>
            <textarea class="paperwork-textarea" id="deliverables" placeholder="${Lang.get('documentGeneratorDeliverablesPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorTimelineLabel')}</label>
            <textarea class="paperwork-textarea" id="timeline" placeholder="${Lang.get('documentGeneratorTimelinePlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorPricingLabel')}</label>
            <textarea class="paperwork-textarea" id="pricing" placeholder="${Lang.get('documentGeneratorPricingPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorTeamLabel')}</label>
            <textarea class="paperwork-textarea" id="team-qualifications" placeholder="${Lang.get('documentGeneratorTeamPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorCaseStudiesLabel')}</label>
            <textarea class="paperwork-textarea" id="case-studies" placeholder="${Lang.get('documentGeneratorCaseStudiesPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorCallToActionLabel')}</label>
            <textarea class="paperwork-textarea" id="call-to-action" placeholder="${Lang.get('documentGeneratorCallToActionPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorTermsConditionsLabel')}</label>
            <textarea class="paperwork-textarea" id="terms-conditions" placeholder="${Lang.get('documentGeneratorTermsConditionsPlaceholder')}" rows="4"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorProposalStyleLabel')}</label>
            <select class="paperwork-select" id="proposal-style">
                <option value="professional">${Lang.get('documentGeneratorProposalStyleProfessional')}</option>
                <option value="persuasive">${Lang.get('documentGeneratorProposalStylePersuasive')}</option>
                <option value="technical">${Lang.get('documentGeneratorProposalStyleTechnical')}</option>
                <option value="creative">${Lang.get('documentGeneratorProposalStyleCreative')}</option>
                <option value="consultative">${Lang.get('documentGeneratorProposalStyleConsultative')}</option>
            </select>
        </div>
    `;
    }

    // Returns HTML fields for a memo form
    getMemoFields() {
        return `
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoCompanyLabel')}</label>
            <textarea class="paperwork-textarea" id="memo-company-info" placeholder="${Lang.get('documentGeneratorMemoCompanyPlaceholder')}"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorDateLabel')}</label>
            <input type="date" class="paperwork-input" id="memo-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoToLabel')}</label>
            <textarea class="paperwork-textarea" id="memo-to" placeholder="${Lang.get('documentGeneratorMemoToPlaceholder')}"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoFromLabel')}</label>
            <input type="text" class="paperwork-input" id="memo-from" placeholder="${Lang.get('documentGeneratorMemoFromPlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoSubjectLabel')}</label>
            <input type="text" class="paperwork-input" id="memo-subject" placeholder="${Lang.get('documentGeneratorMemoSubjectPlaceholder')}">
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoBodyLabel')}</label>
            <textarea class="paperwork-textarea" id="memo-body" placeholder="${Lang.get('documentGeneratorMemoBodyPlaceholder')}" rows="8"></textarea>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoToneLabel')}</label>
            <select class="paperwork-select" id="memo-tone">
                <option value="professional">${Lang.get('documentGeneratorToneProfessional')}</option>
                <option value="urgent">${Lang.get('documentGeneratorToneUrgent')}</option>
                <option value="informative">${Lang.get('documentGeneratorMemoToneInformative')}</option>
                <option value="formal">${Lang.get('documentGeneratorToneFormal')}</option>
                <option value="direct">${Lang.get('documentGeneratorToneDirect')}</option>
                <option value="collaborative">${Lang.get('documentGeneratorMemoToneCollaborative')}</option>
                <option value="instructional">${Lang.get('documentGeneratorMemoToneInstructional')}</option>
            </select>
        </div>
        
        <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
            <label class="paperwork-label">${Lang.get('documentGeneratorMemoAttachmentsLabel')}</label>
            <input type="text" class="paperwork-input" id="memo-attachments" placeholder="${Lang.get('documentGeneratorMemoAttachmentsPlaceholder')}">
        </div>

    `;
    }

    // Returns HTML fields for meeting minutes form
    getMeetingMinutesFields() {
        return `
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesOrgLabel')}</label>
        <input type="text" class="paperwork-input" id="minutes-org-name" placeholder="${Lang.get('documentGeneratorMinutesOrgPlaceholder')}">
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesTitleLabel')}</label>
        <input type="text" class="paperwork-input" id="minutes-title" placeholder="${Lang.get('documentGeneratorMinutesTitlePlaceholder')}">
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesDateTimeLabel')}</label>
        <div style="display: flex; gap: 10px;">
            <input type="date" class="paperwork-input" id="minutes-date" style="flex: 2;" value="${new Date().toISOString().split('T')[0]}">
            <input type="time" class="paperwork-input" id="minutes-time" style="flex: 1;" value="${new Date().toTimeString().split(' ')[0].substring(0, 5)}">
        </div>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesLocationLabel')}</label>
        <input type="text" class="paperwork-input" id="minutes-location" placeholder="${Lang.get('documentGeneratorMinutesLocationPlaceholder')}">
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesFacilitatorLabel')}</label>
        <input type="text" class="paperwork-input" id="minutes-facilitator" placeholder="${Lang.get('documentGeneratorMinutesFacilitatorPlaceholder')}">
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesAttendeesLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-attendees" placeholder="${Lang.get('documentGeneratorMinutesAttendeesPlaceholder')}"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesAbsentLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-absent" placeholder="${Lang.get('documentGeneratorMinutesAbsentPlaceholder')}"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesAgendaLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-agenda" placeholder="${Lang.get('documentGeneratorMinutesAgendaPlaceholder')}" rows="4"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesDiscussionLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-discussion" placeholder="${Lang.get('documentGeneratorMinutesDiscussionPlaceholder')}" rows="6"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesDecisionsLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-decisions" placeholder="${Lang.get('documentGeneratorMinutesDecisionsPlaceholder')}" rows="4"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesActionsLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-actions" placeholder="${Lang.get('documentGeneratorMinutesActionsPlaceholder')}" rows="5"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesNextLabel')}</label>
        <div style="display: flex; gap: 10px;">
            <input type="date" class="paperwork-input" id="minutes-next-date" style="flex: 1;" placeholder="${Lang.get('documentGeneratorMinutesNextDatePlaceholder')}">
            <input type="time" class="paperwork-input" id="minutes-next-time" style="flex: 1;" placeholder="${Lang.get('documentGeneratorMinutesNextTimePlaceholder')}">
        </div>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesNotesLabel')}</label>
        <textarea class="paperwork-textarea" id="minutes-notes" placeholder="${Lang.get('documentGeneratorMinutesNotesPlaceholder')}" rows="3"></textarea>
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesPreparerLabel')}</label>
        <input type="text" class="paperwork-input" id="minutes-preparer" placeholder="${Lang.get('documentGeneratorMinutesPreparerPlaceholder')}">
    </div>
    
    <div class="paperwork-form-group" style="box-sizing: border-box; max-width: 100%;">
        <label class="paperwork-label">${Lang.get('documentGeneratorMinutesStyleLabel')}</label>
        <select class="paperwork-select" id="minutes-style">
            <option value="formal">${Lang.get('documentGeneratorMinutesStyleFormal')}</option>
            <option value="concise">${Lang.get('documentGeneratorMinutesStyleConcise')}</option>
            <option value="detailed">${Lang.get('documentGeneratorMinutesStyleDetailed')}</option>
            <option value="action-focused">${Lang.get('documentGeneratorMinutesStyleActionFocused')}</option>
        </select>
    </div>
    `;
    }

    // Returns HTML fields for a template preview
    renderTemplateFieldsPreview(fields) {
        if (!fields || fields.length === 0) {
            return `<div class="template-empty-state" style="text-align: center; padding: 20px; color: var(--text-secondary);">${Lang.get('documentGeneratorTemplateEmptyState')}</div>`;
        }

        return fields.map((field, index) => {
            let fieldPreview = '';

            switch (field.type) {
                case 'text':
                    fieldPreview = `
                <div class="template-field-preview" data-field-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 8px; background-color: var(--bg-color);">
                    <div>
                        <strong>${field.label || Lang.get('documentGeneratorTextFieldDefault')}</strong>
                        <span class="field-type-badge" style="font-size: 11px; background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">${Lang.get('documentGeneratorTextFieldBadge')}</span>
                    </div>
                    <div class="template-field-actions">
                        <button class="field-edit-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px; margin-right: 5px;">${Lang.get('documentGeneratorEditButton')}</button>
                        <button class="field-delete-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px;">${Lang.get('documentGeneratorDeleteButton')}</button>
                    </div>
                </div>`;
                    break;

                case 'textarea':
                    fieldPreview = `
                <div class="template-field-preview" data-field-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 8px; background-color: var(--bg-color);">
                    <div>
                        <strong>${field.label || Lang.get('documentGeneratorTextAreaDefault')}</strong>
                        <span class="field-type-badge" style="font-size: 11px; background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">${Lang.get('documentGeneratorTextAreaBadge')}</span>
                    </div>
                    <div class="template-field-actions">
                        <button class="field-edit-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px; margin-right: 5px;">${Lang.get('documentGeneratorEditButton')}</button>
                        <button class="field-delete-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px;">${Lang.get('documentGeneratorDeleteButton')}</button>
                    </div>
                </div>`;
                    break;

                case 'image':
                    fieldPreview = `
                <div class="template-field-preview" data-field-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 8px; background-color: var(--bg-color);">
                    <div>
                        <strong>${field.label || Lang.get('documentGeneratorImageDefault')}</strong>
                        <span class="field-type-badge" style="font-size: 11px; background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">${Lang.get('documentGeneratorImageBadge')}</span>
                    </div>
                    <div class="template-field-actions">
                        <button class="field-edit-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px; margin-right: 5px;">${Lang.get('documentGeneratorEditButton')}</button>
                        <button class="field-delete-btn paperwork-btn paperwork-btn-secondary" style="padding: 2px 8px;">${Lang.get('documentGeneratorDeleteButton')}</button>
                    </div>
                </div>`;
                    break;
            }

            return fieldPreview;
        }).join('');
    }

    // Enhances a specific field in the template
    enhanceField(fieldId, template) {
        const fieldElement = document.getElementById(`field-${fieldId}`);

        if (!fieldElement || !fieldElement.value.trim()) {
            alert(Lang.get('documentGeneratorEnhanceFieldError'));
            return;
        }

        // Find the field details from the template
        const fieldIndex = parseInt(fieldElement.getAttribute('data-field-index'));
        const field = template.fields[fieldIndex];

        if (!field) {
            console.error('Field not found in template:', fieldId);
            return;
        }

        // Get report type to customize enhancement
        const reportType = 'technical';
        const reportTitle = document.getElementById('report-title').value || 'Report';

        // Show loading state
        this.showLoadingState(Lang.get('documentGeneratorEnhancingField', { field: field.label }));

        // Create system prompt based on field and report type
        const systemPrompt = `You are an expert technical writer specializing in ${reportType} reports.
        Always write in the user language. 
        Your task is to enhance and improve the content provided while maintaining its original intent and technical accuracy.
        You are enhancing the "${field.label}" section of a ${reportType} report titled "${reportTitle}".
        
        IMPORTANT GUIDELINES:
        1. Maintain technical accuracy and all factual information
        2. Improve clarity, structure, and professional tone
        3. Use appropriate technical terminology for ${reportType} reports
        4. Keep your response focused on the specific field's purpose
        5. Do not add fictional data or speculate beyond what's provided
        6. Format your response appropriately for a professional technical document`;

        // User prompt with the field content
        const userPrompt = `Please enhance the following ${field.label} content for my ${reportType} report:

        ${fieldElement.value}
        
        Return only the enhanced content without any explanations or additional commentary.`;

        // Call the AI service
        this.callAIService(systemPrompt, userPrompt)
            .then(enhancedContent => {
                // Clear loading state
                this.clearLoadingState();

                if (enhancedContent && enhancedContent !== 'AI failed to reply') {
                    // Update the field with enhanced content
                    fieldElement.value = enhancedContent;

                    // Provide visual feedback that enhancement was successful
                    fieldElement.style.transition = 'background-color 0.5s';
                    fieldElement.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
                    setTimeout(() => {
                        fieldElement.style.backgroundColor = '';
                    }, 1500);
                } else {
                    alert(Lang.get('documentGeneratorEnhanceFailure'));
                }
            })
            .catch(error => {
                this.clearLoadingState();
                console.error('Error enhancing field:', error);
                alert(Lang.get('documentGeneratorEnhanceFieldError'));
            });
    }

    // Enhances all fields in the template
    enhanceAllFields(template) {
        // Get all text and textarea fields
        const textFields = template.fields.filter(field => field.type === 'text' || field.type === 'textarea');

        // Check if there are any text fields with content
        const fieldsWithContent = textFields.filter(field => {
            const element = document.getElementById(`field-${field.id}`);
            return element && element.value.trim().length > 0;
        });

        if (fieldsWithContent.length === 0) {
            alert(Lang.get('documentGeneratorEnhanceAllFieldsError'));
            return;
        }

        // Show loading state
        this.showLoadingState(Lang.get('documentGeneratorEnhancingAll'));

        // Get report type and title
        const reportType = 'technical';
        const reportTitle = document.getElementById('report-title').value || 'Report';

        // Process each field with content sequentially
        const processFields = async () => {
            for (const field of fieldsWithContent) {
                const fieldElement = document.getElementById(`field-${field.id}`);
                const originalContent = fieldElement.value;

                // Skip if no content
                if (!originalContent.trim()) continue;

                // Update loading message
                this.clearLoadingState();
                this.showLoadingState(Lang.get('documentGeneratorEnhancingField', { field: field.label }));

                // Create system prompt based on field and report type
                const systemPrompt = `You are an expert technical writer specializing in ${reportType} reports.
                Always write in the user language. 
                Your task is to enhance and improve the content provided while maintaining its original intent and technical accuracy.
                You are enhancing the "${field.label}" section of a ${reportType} report titled "${reportTitle}".
                
                IMPORTANT GUIDELINES:
                1. Maintain technical accuracy and all factual information
                2. Improve clarity, structure, and professional tone
                3. Use appropriate technical terminology for ${reportType} reports
                4. Keep your response focused on the specific field's purpose
                5. Do not add fictional data or speculate beyond what's provided
                6. Format your response appropriately for a professional technical document`;

                // User prompt with the field content
                const userPrompt = `Please enhance the following ${field.label} content for my ${reportType} report:

                ${originalContent}
                
                Return only the enhanced content without any explanations or additional commentary.`;

                try {
                    // Call the AI service
                    const enhancedContent = await this.callAIService(systemPrompt, userPrompt);

                    if (enhancedContent && enhancedContent !== 'AI failed to reply') {
                        // Update the field with enhanced content
                        fieldElement.value = enhancedContent;

                        // Provide visual feedback that enhancement was successful
                        fieldElement.style.transition = 'background-color 0.5s';
                        fieldElement.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
                        setTimeout(() => {
                            fieldElement.style.backgroundColor = '';
                        }, 1500);
                    }
                } catch (error) {
                    console.error(`Error enhancing field ${field.label}:`, error);
                    // Continue with other fields even if one fails
                }

                // Small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        };

        // Process fields and show completion
        processFields()
            .then(() => {
                this.clearLoadingState();
                alert(Lang.get('documentGeneratorEnhanceAllComplete'));
            })
            .catch(error => {
                this.clearLoadingState();
                console.error('Error in enhancing all fields:', error);
                alert(Lang.get('documentGeneratorEnhanceError'));
            });
    }
    addFieldEventListeners() {
        document.querySelectorAll('.field-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldCard = e.target.closest('.template-field-preview');
                const fieldIndex = parseInt(fieldCard.getAttribute('data-field-index'));
                const currentFields = this.getCurrentTemplateFields();

                if (currentFields[fieldIndex]) {
                    this.showFieldEditDialog(currentFields[fieldIndex], fieldIndex);
                }
            });
        });

        document.querySelectorAll('.field-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldCard = e.target.closest('.template-field-preview');
                const fieldIndex = parseInt(fieldCard.getAttribute('data-field-index'));
                let currentFields = this.getCurrentTemplateFields();

                currentFields = currentFields.filter((_, i) => i !== fieldIndex);
                document.getElementById('template-fields-container').setAttribute('data-fields', JSON.stringify(currentFields));
                document.getElementById('template-fields-container').innerHTML = this.renderTemplateFieldsPreview(currentFields);
                this.addFieldEventListeners();
            });
        });
    }

    // Ensures proper punctuation at the end of a string
    ensureProperPunctuation(text) {
        if (!text || typeof text !== 'string') return text;

        // Trim the text to remove any trailing whitespace
        const trimmedText = text.trim();

        // If text is empty after trimming, return as is
        if (trimmedText.length === 0) return text;

        // Check if the text already ends with punctuation
        const endsWithPunctuation = /[.!?]$/.test(trimmedText);

        // If it doesn't end with punctuation, add a period
        return endsWithPunctuation ? trimmedText : trimmedText + '.';
    }

    // Ensures all fields in a data object have proper punctuation
    ensureAllFieldsHavePunctuation(dataObject) {
        if (!dataObject || typeof dataObject !== 'object') return dataObject;

        const result = { ...dataObject };

        // Process each property in the object
        for (const key in result) {
            if (typeof result[key] === 'string' && result[key].trim().length > 0) {
                // Only process non-empty string values
                result[key] = this.ensureProperPunctuation(result[key]);
            }
        }

        return result;
    }

    // Generates a document based on the selected template type
    async generateDocument(templateType) {
        //console.log(`Paperwork: Generating document for template: ${templateType}`);

        // For business letters, validate form fields before proceeding
        if (templateType === 'business-letter') {
            // Required fields for business letter
            const requiredFields = [
                { id: 'location-info', label: Lang.get('documentGeneratorLocationInfo') },
                { id: 'recipient-info', label: Lang.get('documentGeneratorRecipientInfo') },
                { id: 'letter-subject', label: Lang.get('documentGeneratorSubject') },
                { id: 'letter-body', label: Lang.get('documentGeneratorLetterBody') },
                { id: 'letter-signature', label: Lang.get('documentGeneratorSignature') }
            ];

            // Check for empty required fields
            const emptyFields = requiredFields.filter(field => {
                const element = document.getElementById(field.id);
                return !element || !element.value.trim();
            });

            // If any required fields are empty, show error message and abort
            if (emptyFields.length > 0) {
                const missingFields = emptyFields.map(f => f.label).join(', ');
                alert(Lang.get('documentGeneratorRequiredFieldsError', { fields: missingFields }));
                return; // Exit the function early
            }
        } else if (templateType === 'contract') {
            // Required fields for contracts
            const requiredFields = [
                { id: 'contract-title', label: Lang.get('documentGeneratorContractTitle') },
                { id: 'party1-info', label: Lang.get('documentGeneratorParty1Info') },
                { id: 'party2-info', label: Lang.get('documentGeneratorParty2Info') },
                { id: 'contract-term', label: Lang.get('documentGeneratorTermDuration') },
                { id: 'contract-scope', label: Lang.get('documentGeneratorScopeOfWork') }
            ];

            // Check for empty required fields
            const emptyFields = requiredFields.filter(field => {
                const element = document.getElementById(field.id);
                return !element || !element.value.trim();
            });

            // If any required fields are empty, show error message and abort
            if (emptyFields.length > 0) {
                const missingFields = emptyFields.map(f => f.label).join(', ');
                alert(Lang.get('documentGeneratorRequiredFieldsError', { fields: missingFields }));
                return; // Exit the function early
            }
        } else if (templateType === 'proposal') {
            // Required fields for business proposals
            const requiredFields = [
                { id: 'company-info', label: Lang.get('documentGeneratorCompanyInfo') },
                { id: 'client-info', label: Lang.get('documentGeneratorClientInfo') },
                { id: 'proposal-title', label: Lang.get('documentGeneratorProposalTitle') },
                { id: 'proposal-summary', label: Lang.get('documentGeneratorExecutiveSummary') },
                { id: 'problem-statement', label: Lang.get('documentGeneratorProblemStatement') },
                { id: 'proposed-solution', label: Lang.get('documentGeneratorProposedSolution') }
            ];

            // Check for empty required fields
            const emptyFields = requiredFields.filter(field => {
                const element = document.getElementById(field.id);
                return !element || !element.value.trim();
            });

            // If any required fields are empty, show error message and abort
            if (emptyFields.length > 0) {
                const missingFields = emptyFields.map(f => f.label).join(', ');
                alert(Lang.get('documentGeneratorRequiredFieldsError', { fields: missingFields }));
                return; // Exit the function early
            }
        } else if (templateType === 'memo') {
            // Required fields for memos
            const requiredFields = [
                { id: 'memo-to', label: Lang.get('documentGeneratorRecipientInfo') },
                { id: 'memo-from', label: Lang.get('documentGeneratorSenderInfo') },
                { id: 'memo-subject', label: Lang.get('documentGeneratorSubject') },
                { id: 'memo-body', label: Lang.get('documentGeneratorMemoContent') }
            ];

            // Check for empty required fields
            const emptyFields = requiredFields.filter(field => {
                const element = document.getElementById(field.id);
                return !element || !element.value.trim();
            });

            // If any required fields are empty, show error message and abort
            if (emptyFields.length > 0) {
                const missingFields = emptyFields.map(f => f.label).join(', ');
                alert(Lang.get('documentGeneratorRequiredFieldsError', { fields: missingFields }));
                return; // Exit the function early
            }
        } else if (templateType === 'meeting-minutes') {
            // Required fields for meeting minutes
            const requiredFields = [
                { id: 'minutes-title', label: Lang.get('documentGeneratorMeetingTitle') },
                { id: 'minutes-date', label: Lang.get('documentGeneratorDate') },
                { id: 'minutes-attendees', label: Lang.get('documentGeneratorAttendees') },
                { id: 'minutes-discussion', label: Lang.get('documentGeneratorDiscussionPoints') }
            ];

            // Check for empty required fields
            const emptyFields = requiredFields.filter(field => {
                const element = document.getElementById(field.id);
                return !element || !element.value.trim();
            });

            // If any required fields are empty, show error message and abort
            if (emptyFields.length > 0) {
                const missingFields = emptyFields.map(f => f.label).join(', ');
                alert(Lang.get('documentGeneratorRequiredFieldsError', { fields: missingFields }));
                return; // Exit the function early
            }
        }
        // Save the form data before proceeding
        await this.saveLetterData(templateType);

        // Proceed with document generation if validation passes
        try {
            // This is now an async call
            this.documentContent = await this.generateDocumentContent(templateType);

            this.closeFloatingWindow();

            setTimeout(() => {
                this.showDocumentPreview(templateType);
            }, 300);
        } catch (error) {
            console.error('Error generating document:', error);
            // Show error message to user
            alert(Lang.get('documentGeneratorGenerateError'));
        }
    }
   
    // Generates the content for the document based on the template type
    async generateDocumentContent(templateType) {
        let content = '';

        const date = document.getElementById('letter-date')?.value || new Date().toLocaleDateString();

        switch (templateType) {
            case 'business-letter':
                // Get all form values
                let letterData = {
                    location: document.getElementById('location-info')?.value || Lang.get('documentGeneratorLocationPlaceholder1'),
                    recipient: document.getElementById('recipient-info')?.value || Lang.get('documentGeneratorRecipientPlaceholder1'),
                    subject: document.getElementById('letter-subject')?.value || Lang.get('documentGeneratorSubjectPlaceholder1'),
                    greeting: document.getElementById('letter-greeting')?.value || Lang.get('documentGeneratorGreetingDefault1'),
                    date: document.getElementById('letter-date')?.value || new Date().toLocaleDateString(),
                    body: document.getElementById('letter-body')?.value || Lang.get('documentGeneratorBodyPlaceholder1'),
                    tone: document.getElementById('letter-tone')?.value || 'professional',
                    closing: document.getElementById('letter-closing')?.value || Lang.get('documentGeneratorClosingDefault1'),
                    signature: document.getElementById('letter-signature')?.value || Lang.get('documentGeneratorSignaturePlaceholder1')
                };

                // Ensure all fields have proper punctuation
                letterData = this.ensureAllFieldsHavePunctuation(letterData);

                // Format the date nicely
                let formattedDate = letterData.date;
                try {
                    // Convert YYYY-MM-DD to a more readable format
                    if (letterData.date.includes('-')) {
                        const dateObj = new Date(letterData.date);
                        formattedDate = this.formatDateForRegion(letterData.date);
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                }

                // If the body has content and we should use AI enhancement
                if (letterData.body && letterData.body !== '[Letter Body].') {
                    try {
                        // Show loading state
                        this.showLoadingState(Lang.get('documentGeneratorEnhancing'));

                        // Create improved system prompt with more explicit instructions
                        const systemPrompt = `You are an expert business letter writer. Always write in the user language. Your task is to enhance and polish business letter content while maintaining its original intent and information. Make the letter more professional, clear, and effective. Use a ${letterData.tone} tone.
    
                    IMPORTANT FORMATTING RULES:
                    1. Start your response directly with the greeting (e.g., "Dear John,")
                    2. DO NOT include any letter header information such as location name, date, recipient, or subject line
                    3. Only provide the actual letter content starting with the greeting and ending with the closing and signature (e.g., "Sincerely, John Smith")
                    4. DO NOT include any formatting instructions or separators`;

                        const userPrompt = `Letter components for context:
                    - Recipient: ${letterData.recipient} 
                    - Subject: ${letterData.subject}
                    - Greeting: ${letterData.greeting}
                    - Original Body: ${letterData.body}
                    - Closing: ${letterData.closing}
                    - Signature: ${letterData.signature}

                    Provide only the enhanced letter content starting with the greeting (e.g., "Dear John,"), followed by the improved body paragraphs, and ending with the closing and signature (e.g., "Sincerely, Bob Henkins").`;

                        // Call the AI service with our improved prompts
                        const enhancedBody = await this.callAIService(systemPrompt, userPrompt);

                        // Use the enhanced body if available, otherwise fall back to original
                        const finalBody = enhancedBody || letterData.body;

                        // Clear loading state
                        this.clearLoadingState();

                        // Generate the HTML content with location, date at the top and the enhanced body
                        content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                        <div style="text-align: right; margin-bottom: 20px;">
                            ${letterData.location}<br>
                            ${formattedDate}
                        </div>
                        <div style="white-space: pre-line;">${finalBody}</div>
                    </div>`;
                    } catch (error) {
                        console.error('Error enhancing letter:', error);
                        // Error handling...
                    }
                }
                break;

            case 'contract':
                // Get form values for contract
                let contractData = {
                    contractType: document.getElementById('contract-type')?.value || 'service',
                    contractTitle: document.getElementById('contract-title')?.value || Lang.get('documentGeneratorContractTitlePlaceholder1'),
                    party1: document.getElementById('party1-info')?.value || Lang.get('documentGeneratorParty1Placeholder1'),
                    party2: document.getElementById('party2-info')?.value || Lang.get('documentGeneratorParty2Placeholder1'),
                    contractDate: document.getElementById('contract-date')?.value || new Date().toLocaleDateString(),
                    term: document.getElementById('contract-term')?.value || Lang.get('documentGeneratorTermPlaceholder1'),
                    scope: document.getElementById('contract-scope')?.value || Lang.get('documentGeneratorScopePlaceholder1'),
                    payment: document.getElementById('contract-payment')?.value || Lang.get('documentGeneratorPaymentPlaceholder1'),
                    confidentiality: document.getElementById('contract-confidentiality')?.value || '',
                    ip: document.getElementById('contract-ip')?.value || '',
                    termination: document.getElementById('contract-termination')?.value || '',
                    disputes: document.getElementById('contract-disputes')?.value || '',
                    terms: document.getElementById('contract-terms')?.value || ''
                };
                // Ensure all fields have proper punctuation
                contractData = this.ensureAllFieldsHavePunctuation(contractData);

                // Format the date nicely - using contractDate instead of date
                let formattedContractDate = contractData.contractDate;
                try {
                    // Convert YYYY-MM-DD to a more readable format
                    if (contractData.contractDate.includes('-')) {
                        const dateObj = new Date(contractData.contractDate);
                        formattedContractDate = this.formatDateForRegion(contractData.contractDate);
                    }
                } catch (e) {
                    console.error('Error formatting contract date:', e);
                }

                try {
                    // Show loading state
                    this.showLoadingState(Lang.get('documentGeneratorGeneratingContract'));

                    // Create system prompt appropriate for contract generation
                    const systemPrompt = `You are an expert legal document writer specializing in ${contractData.contractType} contracts.
                    Always write in the user language. 
                    Your task is to create a professional, legally-sound contract template based on the information provided.
                    This is for EDUCATIONAL AND DEMONSTRATION PURPOSES ONLY, not for actual legal use.
                    
                    IMPORTANT FORMATTING RULES:
                    1. Use a professional, formal legal writing style
                    2. Structure the contract with proper sections, headings, and numbering
                    3. Format dates, names, and monetary amounts professionally
                    4. Include standard legal clauses appropriate for this type of contract
                    5. Ensure all provided information is integrated seamlessly
                    6. Fill in any missing standard clauses that would be expected in this type of contract`;

                    const userPrompt = `Create a ${contractData.contractType} contract with the following details:
                    - Contract Title: ${contractData.contractTitle}
                    - Party 1: ${contractData.party1}
                    - Party 2: ${contractData.party2}
                    - Effective Date: ${formattedContractDate}
                    - Term/Duration: ${contractData.term}
                    - Scope of Work/Services: ${contractData.scope}
                    - Payment Terms: ${contractData.payment}
                    ${contractData.confidentiality ? `- Confidentiality Provisions: ${contractData.confidentiality}` : ''}
                    ${contractData.ip ? `- Intellectual Property Rights: ${contractData.ip}` : ''}
                    ${contractData.termination ? `- Termination Conditions: ${contractData.termination}` : ''}
                    ${contractData.disputes ? `- Dispute Resolution: ${contractData.disputes}` : ''}
                    ${contractData.terms ? `- Additional Terms: ${contractData.terms}` : ''}
                    
                    Format the contract professionally with appropriate headings, sections, and legal language. Include standard clauses expected in a ${contractData.contractType} contract.`;

                    // Call the AI service with our prompts
                    const contractBody = await this.callAIService(systemPrompt, userPrompt);

                    // Clear loading state
                    this.clearLoadingState();

                    // Generate the HTML content for the contract
                    content = `<div style="font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="text-transform: uppercase; letter-spacing: 1px;">${contractData.contractTitle}</h2>
                    <p>${Lang.get('documentGeneratorEffectiveDateLabel')} ${formattedContractDate}</p>
                </div>
                <div style="white-space: pre-line; text-align: justify;">${contractBody}</div>
                </div>`;
                } catch (error) {
                    console.error('Error generating contract:', error);
                    this.clearLoadingState();

                    // Fallback: Create a basic contract without AI if there's an error
                    content = `<div style="font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="text-transform: uppercase; letter-spacing: 1px;">${contractData.contractTitle}</h2>
                    <p>${Lang.get('documentGeneratorEffectiveDateLabel')} ${formattedContractDate}</p>
                </div>
                <div style="white-space: pre-line; text-align: justify;">
                    <p><strong>${Lang.get('documentGeneratorContractPartiesHeader')}</strong></p>
                    <p>${Lang.get('documentGeneratorContractAgreementText', { title: contractData.contractTitle })}</p>
                    
                    <p><strong>${Lang.get('documentGeneratorContractTermHeader')}</strong></p>
                    <p>${contractData.term}</p>
                    
                    <p><strong>${Lang.get('documentGeneratorContractScopeHeader')}</strong></p>
                    <p>${contractData.scope}</p>
                    
                    <p><strong>${Lang.get('documentGeneratorContractPaymentHeader')}</strong></p>
                    <p>${contractData.payment}</p>
                    
                    ${contractData.confidentiality ? `<p><strong>${Lang.get('documentGeneratorContractConfidentialityHeader')}</strong></p><p>${contractData.confidentiality}</p>` : ''}
                    ${contractData.ip ? `<p><strong>${Lang.get('documentGeneratorContractIPHeader')}</strong></p><p>${contractData.ip}</p>` : ''}
                    ${contractData.termination ? `<p><strong>${Lang.get('documentGeneratorContractTerminationHeader')}</strong></p><p>${contractData.termination}</p>` : ''}
                    ${contractData.disputes ? `<p><strong>${Lang.get('documentGeneratorContractDisputeHeader')}</strong></p><p>${contractData.disputes}</p>` : ''}
                    ${contractData.terms ? `<p><strong>${Lang.get('documentGeneratorContractAdditionalHeader')}</strong></p><p>${contractData.terms}</p>` : ''}
                    
                    <p><strong>${Lang.get('documentGeneratorContractSignaturesHeader')}</strong></p>
                    <p>${Lang.get('documentGeneratorContractWitnessText')}</p>
                    <p>${Lang.get('documentGeneratorContractParty1Signature')}</p>
                    <p>${Lang.get('documentGeneratorContractParty2Signature')}</p>
                    </div>
                </div>`;
                }
                break;

            case 'proposal':
                // Get all form values
                let proposalData = {
                    companyInfo: document.getElementById('company-info')?.value || Lang.get('documentGeneratorProposalCompanyPlaceholder1'),
                    clientInfo: document.getElementById('client-info')?.value || Lang.get('documentGeneratorProposalClientPlaceholder1'),
                    proposalTitle: document.getElementById('proposal-title')?.value || Lang.get('documentGeneratorProposalTitlePlaceholder1'),
                    proposalType: document.getElementById('proposal-type')?.value || 'services',
                    summary: document.getElementById('proposal-summary')?.value || '',
                    problemStatement: document.getElementById('problem-statement')?.value || '',
                    solution: document.getElementById('proposed-solution')?.value || '',
                    deliverables: document.getElementById('deliverables')?.value || '',
                    timeline: document.getElementById('timeline')?.value || '',
                    pricing: document.getElementById('pricing')?.value || '',
                    team: document.getElementById('team-qualifications')?.value || '',
                    caseStudies: document.getElementById('case-studies')?.value || '',
                    callToAction: document.getElementById('call-to-action')?.value || '',
                    termsConditions: document.getElementById('terms-conditions')?.value || '',
                    proposalStyle: document.getElementById('proposal-style')?.value || 'professional'
                };

                // Ensure all fields have proper punctuation
                proposalData = this.ensureAllFieldsHavePunctuation(proposalData);

                // Format the date nicely
                let formattedProposalDate = this.formatDateForRegion(new Date());

                try {
                    // Show loading state
                    this.showLoadingState(Lang.get('documentGeneratorGeneratingProposal'));

                    // Create system prompt for the proposal
                    const systemPrompt = `You are an expert business proposal writer specializing in ${proposalData.proposalType} proposals.
                    Always write in the user language. 
                    Your task is to create a compelling, persuasive business proposal based on the information provided.
                    This proposal should follow a ${proposalData.proposalStyle} style and tone.
                    
                    IMPORTANT FORMATTING RULES:
                    1. Use professional business language
                    2. Use clear headings for each section
                    3. Format lists with bullet points where appropriate
                    4. Emphasize key benefits and value propositions
                    5. Present information in a logical, flowing narrative
                    6. Use persuasive language that focuses on client benefits
                    7. Add appropriate transitions between sections`;

                    const userPrompt = `Create a business proposal with the following information:
                    - Company Information: ${proposalData.companyInfo}
                    - Client Information: ${proposalData.clientInfo}
                    - Proposal Title: ${proposalData.proposalTitle}
                    - Proposal Type: ${proposalData.proposalType}
                    - Executive Summary: ${proposalData.summary}
                    - Problem Statement/Client Needs: ${proposalData.problemStatement}
                    - Proposed Solution: ${proposalData.solution}
                    - Deliverables: ${proposalData.deliverables}
                    - Timeline/Schedule: ${proposalData.timeline}
                    - Pricing/Investment: ${proposalData.pricing}
                    - Team/Qualifications: ${proposalData.team}
                    - Case Studies/Examples: ${proposalData.caseStudies}
                    - Call to Action: ${proposalData.callToAction}
                    - Terms and Conditions: ${proposalData.termsConditions}
                    
                    Format this as a complete business proposal with clear sections and professional language. The proposal should be ready to present to a client.`;

                    // Call the AI service with our prompts
                    const proposalBody = await this.callAIService(systemPrompt, userPrompt);

                    // Clear loading state
                    this.clearLoadingState();

                    // Generate the HTML content
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                   <div style="text-align: center; margin-bottom: 20px;">
                       <h1 style="color: #2c3e50; margin-bottom: 5px;">${proposalData.proposalTitle}</h1>
                       <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedLabel')} ${formattedProposalDate}</p>
                       <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedForLabel')} ${proposalData.clientInfo.split('\n')[0]}</p>
                       <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedByLabel')} ${proposalData.companyInfo.split('\n')[0]}</p>
                   </div>
                   <div style="white-space: pre-line; text-align: justify;">${proposalBody}</div>
                   <div style="margin-top: 30px; text-align: center;">
                       <p>${Lang.get('documentGeneratorContactMessage')}</p>
                       <p>${proposalData.companyInfo}</p>
                   </div>
                  </div>`;
                } catch (error) {
                    console.error('Error generating business proposal:', error);
                    this.clearLoadingState();

                    // Fallback content if AI generation fails
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                     <div style="text-align: center; margin-bottom: 20px;">
                         <h1 style="color: #2c3e50; margin-bottom: 5px;">${proposalData.proposalTitle}</h1>
                         <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedLabel')} ${formattedProposalDate}</p>
                         <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedForLabel')} ${proposalData.clientInfo.split('\n')[0]}</p>
                         <p style="color: #7f8c8d;">${Lang.get('documentGeneratorPreparedByLabel')} ${proposalData.companyInfo.split('\n')[0]}</p>
                     </div>
        
                        <h2>${Lang.get('documentGeneratorExecutiveSummaryHeader')}</h2>
                        <p>${proposalData.summary}</p>
                        
                        <h2>${Lang.get('documentGeneratorUnderstandingNeedsHeader')}</h2>
                        <p>${proposalData.problemStatement}</p>
                        
                        <h2>${Lang.get('documentGeneratorOurSolutionHeader')}</h2>
                        <p>${proposalData.solution}</p>
                        
                        <h2>${Lang.get('documentGeneratorDeliverablesHeader')}</h2>
                        <p>${proposalData.deliverables}</p>
                        
                        <h2>${Lang.get('documentGeneratorTimelineHeader')}</h2>
                        <p>${proposalData.timeline}</p>
                        
                        <h2>${Lang.get('documentGeneratorInvestmentHeader')}</h2>
                        <p>${proposalData.pricing}</p>
                        
                        <h2>${Lang.get('documentGeneratorAboutTeamHeader')}</h2>
                        <p>${proposalData.team}</p>
                        
                        <h2>${Lang.get('documentGeneratorSuccessStoriesHeader')}</h2>
                        <p>${proposalData.caseStudies}</p>
                        
                        <h2>${Lang.get('documentGeneratorNextStepsHeader')}</h2>
                        <p>${proposalData.callToAction}</p>
                        
                        <h2>${Lang.get('documentGeneratorTermsConditionsHeader')}</h2>
                        <p>${proposalData.termsConditions}</p>
                        
                        <div style="margin-top: 30px; text-align: center;">
                           <p>${Lang.get('documentGeneratorContactMessage')}</p>
                           <p>${proposalData.companyInfo}</p>
                        </div>
                    </div>`;
                }
                break;

            case 'memo':
                // Get all form values
                let memoData = {
                    companyInfo: document.getElementById('memo-company-info')?.value || '',
                    date: document.getElementById('memo-date')?.value || new Date().toLocaleDateString(),
                    to: document.getElementById('memo-to')?.value || Lang.get('documentGeneratorMemoToPlaceholder1'),
                    from: document.getElementById('memo-from')?.value || Lang.get('documentGeneratorMemoFromPlaceholder1'),
                    subject: document.getElementById('memo-subject')?.value || Lang.get('documentGeneratorMemoSubjectPlaceholder1'),
                    body: document.getElementById('memo-body')?.value || Lang.get('documentGeneratorMemoBodyPlaceholder1'),
                    tone: document.getElementById('memo-tone')?.value || 'professional',
                    attachments: document.getElementById('memo-attachments')?.value || '',
                };

                // Ensure all fields have proper punctuation
                memoData = this.ensureAllFieldsHavePunctuation(memoData);

                // Format the date nicely
                let formattedMemoDate = memoData.date;
                try {
                    // Convert YYYY-MM-DD to a more readable format
                    if (memoData.date.includes('-')) {
                        const dateObj = new Date(memoData.date);
                        formattedMemoDate = this.formatDateForRegion(memoData.date);
                    }
                } catch (e) {
                    console.error('Error formatting memo date:', e);
                }

                try {
                    // Show loading state
                    this.showLoadingState(Lang.get('documentGeneratorGeneratingMemo'));

                    // Create system prompt for memo generation
                    const systemPrompt = `You are an expert memo writer specializing in corporate internal communications.
                    Always write in the user language. 
                Your task is to enhance and format the memo content while maintaining its original intent and information.
                This memo should follow a ${memoData.tone} tone.
                
                IMPORTANT FORMATTING GUIDELINES:
                1. Keep the memo concise, clear, and to the point
                2. Maintain a professional business writing style
                3. Structure the content with logical paragraphs
                4. Begin with the main point or purpose of the memo
                5. Include any necessary context or background information
                6. End with any required actions, next steps, or conclusions
                7. DO NOT add fictional data beyond what's provided
                8. DO NOT include letterhead or header information in your response`;

                    const userPrompt = `Create a polished version of this memo with the following details:
                - To: ${memoData.to}
                - From: ${memoData.from}
                - Subject: ${memoData.subject}
                - Original Body: ${memoData.body}
                ${memoData.attachments ? `- Attachments: ${memoData.attachments}` : ''}
                
                Please provide only the enhanced memo body content. The header information (TO, FROM, DATE, SUBJECT) will be formatted separately.`;

                    // Call the AI service with our prompts
                    const enhancedBody = await this.callAIService(systemPrompt, userPrompt);

                    // Clear loading state
                    this.clearLoadingState();

                    // Use enhanced body if available, otherwise use original
                    const finalBody = enhancedBody || memoData.body;

                    // Generate the HTML content with memo formatting
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            ${memoData.companyInfo ?
                            `<div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-weight: bold; font-size: 18px;">${memoData.companyInfo.split('\n')[0]}</div>
                    ${memoData.companyInfo.split('\n').slice(1).map(line => `<div>${line}</div>`).join('')}
                </div>` : ''}
            
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${Lang.get('documentGeneratorMemorandum')}</h1>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorDateLabel')}</td>
                    <td style="padding: 8px 10px;">${formattedMemoDate}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorToLabel')}</td>
                    <td style="padding: 8px 10px; white-space: pre-line;">${memoData.to}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorFromLabel')}</td>
                    <td style="padding: 8px 10px;">${memoData.from}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorSubjectLabel')}</td>
                    <td style="padding: 8px 10px; font-weight: bold;">${memoData.subject}</td>
                </tr>
                ${memoData.attachments ?
                            `<tr>
                        <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorAttachmentsLabel')}</td>
                        <td style="padding: 8px 10px;">${memoData.attachments}</td>
                    </tr>` : ''}
            </table>
            
            <div style="padding: 0 10px; white-space: pre-line; text-align: justify; line-height: 1.5;">
                ${finalBody}
            </div>
        </div>`;

                } catch (error) {
                    console.error('Error generating memo:', error);
                    this.clearLoadingState();

                    // Fallback: Create a basic memo without AI if there's an error
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            ${memoData.companyInfo ?
                            `<div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-weight: bold; font-size: 18px;">${memoData.companyInfo.split('\n')[0]}</div>
                    ${memoData.companyInfo.split('\n').slice(1).map(line => `<div>${line}</div>`).join('')}
                </div>` : ''}
            
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${Lang.get('documentGeneratorMemorandum')}</h1>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorDateLabel')}</td>
                    <td style="padding: 8px 10px;">${formattedMemoDate}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorToLabel')}</td>
                    <td style="padding: 8px 10px; white-space: pre-line;">${memoData.to}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorFromLabel')}</td>
                    <td style="padding: 8px 10px;">${memoData.from}</td>
                </tr>
                <tr>
                    <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorSubjectLabel')}</td>
                    <td style="padding: 8px 10px; font-weight: bold;">${memoData.subject}</td>
                </tr>
                ${memoData.attachments ?
                            `<tr>
                        <td style="width: 15%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorAttachmentsLabel')}</td>
                        <td style="padding: 8px 10px;">${memoData.attachments}</td>
                    </tr>` : ''}
            </table>
            
            <div style="padding: 0 10px; white-space: pre-line; text-align: justify; line-height: 1.5;">
                ${memoData.body}
            </div>
        </div>`;
                }
                break;
            case 'meeting-minutes':
                // Get all form values
                let minutesData = {
                    orgName: document.getElementById('minutes-org-name')?.value || '',
                    title: document.getElementById('minutes-title')?.value || Lang.get('documentGeneratorMinutesTitlePlaceholder1'),
                    date: document.getElementById('minutes-date')?.value || new Date().toLocaleDateString(),
                    time: document.getElementById('minutes-time')?.value || '',
                    location: document.getElementById('minutes-location')?.value || '',
                    facilitator: document.getElementById('minutes-facilitator')?.value || '',
                    attendees: document.getElementById('minutes-attendees')?.value || '',
                    absent: document.getElementById('minutes-absent')?.value || '',
                    agenda: document.getElementById('minutes-agenda')?.value || '',
                    discussion: document.getElementById('minutes-discussion')?.value || '',
                    decisions: document.getElementById('minutes-decisions')?.value || '',
                    actions: document.getElementById('minutes-actions')?.value || '',
                    nextDate: document.getElementById('minutes-next-date')?.value || '',
                    nextTime: document.getElementById('minutes-next-time')?.value || '',
                    notes: document.getElementById('minutes-notes')?.value || '',
                    preparer: document.getElementById('minutes-preparer')?.value || '',
                    style: document.getElementById('minutes-style')?.value || 'formal'
                };

                // Ensure all fields have proper punctuation
                minutesData = this.ensureAllFieldsHavePunctuation(minutesData);

                // Format the date nicely
                let formattedMinutesDate = minutesData.date;
                try {
                    // Check if date exists and is valid
                    if (minutesData.date && minutesData.date.trim()) {
                        // Handle different date formats
                        let dateObj;
                        if (minutesData.date.includes('-')) {
                            // Try parsing YYYY-MM-DD format
                            const [year, month, day] = minutesData.date.split('-').map(Number);
                            dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS
                        } else {
                            // Try standard date parsing
                            dateObj = new Date(minutesData.date);
                        }

                        // Verify the date is valid before formatting
                        if (!isNaN(dateObj.getTime())) {
                            formattedMinutesDate = this.formatDateForRegion(minutesData.date);
                        } else {
                            console.warn('Invalid date format in meeting minutes:', minutesData.date);
                        }
                    }
                } catch (e) {
                    console.error('Error formatting meeting minutes date:', e);
                }

                try {
                    // Show loading state
                    this.showLoadingState(Lang.get('documentGeneratorGeneratingMinutes'));

                    // Create system prompt for meeting minutes generation
                    const systemPrompt = `You are an expert in creating professional meeting minutes. Always write in the user language. Your task is to format and enhance meeting minutes content while maintaining all original information.
                These meeting minutes follow a ${minutesData.style} style.
                
                IMPORTANT FORMATTING GUIDELINES:
                1. Keep the information accurate and factual
                2. Maintain a professional, clear writing style
                3. Format the content in a well-organized structure
                4. Ensure action items are clearly highlighted with assignees and deadlines
                5. Make sure all discussions logically flow and are easy to understand
                6. DO NOT add fictional information or participants
                7. DO NOT include letterhead or header information in your response`;

                    const userPrompt = `Create professional meeting minutes using the following information:
                - Organization: ${minutesData.orgName}
                - Meeting Title: ${minutesData.title}
                - Date and Time: ${formattedMinutesDate} ${minutesData.time}
                - Location: ${minutesData.location}
                - Meeting Facilitator: ${minutesData.facilitator}
                - Attendees: ${minutesData.attendees}
                - Absent: ${minutesData.absent}
                - Agenda Items: ${minutesData.agenda}
                - Discussion Points: ${minutesData.discussion}
                - Decisions Made: ${minutesData.decisions}
                - Action Items: ${minutesData.actions}
                - Next Meeting: ${minutesData.nextDate ? `${minutesData.nextDate} ${minutesData.nextTime}` : 'Not scheduled'}
                - Additional Notes: ${minutesData.notes}
                - Prepared By: ${minutesData.preparer}
                
                Please format this as professional meeting minutes, focusing on clarity and organization. Only enhance the structure and presentation of the existing information.`;

                    // Call the AI service with our prompts

                    // Call the AI service with our prompts
                    const enhancedMinutes = await this.callAIService(systemPrompt, userPrompt);

                    // Clear loading state
                    this.clearLoadingState();

                    // Use enhanced content if available, otherwise use original
                    const finalMinutes = enhancedMinutes || minutesData.discussion;

                    // Generate the HTML content with meeting minutes formatting
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    ${minutesData.orgName ?
                            `<div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-weight: bold; font-size: 18px;">${minutesData.orgName}</div>
                        </div>` : ''}
                    
                    <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                        <h1 style="margin: 0; font-size: 24px;">${minutesData.title}</h1>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorDateTimeLabel')}</td>
                            <td style="padding: 8px 10px;">${formattedMinutesDate} ${minutesData.time}</td>
                        </tr>
                        ${minutesData.location ?
                            `<tr>
                                <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorLocationLabel')}</td>
                                <td style="padding: 8px 10px;">${minutesData.location}</td>
                            </tr>` : ''}
                        ${minutesData.facilitator ?
                            `<tr>
                                <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorMeetingFacilitatorLabel')}</td>
                                <td style="padding: 8px 10px;">${minutesData.facilitator}</td>
                            </tr>` : ''}
                    </table>
                    
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAttendeesHeader')}</h2>
                        <div style="padding: 10px; white-space: pre-line;">${minutesData.attendees}</div>
                    </div>
                    
                    ${minutesData.absent ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAbsentHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.absent}</div>
                        </div>` : ''}
                    
                    ${minutesData.agenda ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAgendaHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.agenda}</div>
                        </div>` : ''}
                    
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorDiscussionHeader')}</h2>
                        <div style="padding: 10px; white-space: pre-line;">${minutesData.discussion}</div>
                    </div>
                    
                    ${minutesData.decisions ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorDecisionsHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.decisions}</div>
                        </div>` : ''}
                    
                    ${minutesData.actions ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorActionItemsHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.actions}</div>
                        </div>` : ''}
                    
                    ${minutesData.nextDate ?
                            `<div style="margin-top: 20px; margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorNextMeetingHeader')}</h2>
                            <div style="padding: 10px;">
                                ${minutesData.nextDate} ${minutesData.nextTime}
                            </div>
                        </div>` : ''}
                    
                    ${minutesData.notes ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAdditionalNotesHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.notes}</div>
                        </div>` : ''}
                    
                    ${minutesData.preparer ?
                            `<div style="margin-top: 30px; text-align: right; font-style: italic;">
                            ${Lang.get('documentGeneratorMinutesPreparedBy')} ${minutesData.preparer}
                        </div>` : ''}
                </div>`;

                } catch (error) {
                    console.error('Error generating meeting minutes:', error);
                    this.clearLoadingState();

                    // Fallback: Create basic meeting minutes without AI if there's an error
                    content = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    ${minutesData.orgName ?
                            `<div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-weight: bold; font-size: 18px;">${minutesData.orgName}</div>
                        </div>` : ''}
                    
                    <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                        <h1 style="margin: 0; font-size: 24px;">${Lang.get('documentGeneratorMeetingMinutes')}</h1>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorDateTimeLabel')}</td>
                            <td style="padding: 8px 10px;">${formattedMinutesDate} ${minutesData.time}</td>
                        </tr>
                        ${minutesData.location ?
                            `<tr>
                                <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorLocationLabel')}</td>
                                <td style="padding: 8px 10px;">${minutesData.location}</td>
                            </tr>` : ''}
                        ${minutesData.facilitator ?
                            `<tr>
                                <td style="width: 25%; padding: 8px 10px; font-weight: bold; vertical-align: top;">${Lang.get('documentGeneratorMeetingFacilitatorLabel')}</td>
                                <td style="padding: 8px 10px;">${minutesData.facilitator}</td>
                            </tr>` : ''}
                    </table>
                    
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAttendeesHeader')}</h2>
                        <div style="padding: 10px; white-space: pre-line;">${minutesData.attendees}</div>
                    </div>
                    
                    ${minutesData.absent ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAbsentHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.absent}</div>
                        </div>` : ''}
                    
                    ${minutesData.agenda ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAgendaHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.agenda}</div>
                        </div>` : ''}
                    
                    <div style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorDiscussionHeader')}</h2>
                        <div style="padding: 10px; white-space: pre-line;">${minutesData.discussion}</div>
                    </div>
                    
                    ${minutesData.decisions ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorDecisionsHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.decisions}</div>
                        </div>` : ''}
                    
                    ${minutesData.actions ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorActionItemsHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.actions}</div>
                        </div>` : ''}
                    
                    ${minutesData.nextDate ?
                            `<div style="margin-top: 20px; margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorNextMeetingHeader')}</h2>
                            <div style="padding: 10px;">
                                ${minutesData.nextDate} ${minutesData.nextTime}
                            </div>
                        </div>` : ''}
                    
                    ${minutesData.notes ?
                            `<div style="margin-bottom: 20px;">
                            <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${Lang.get('documentGeneratorAdditionalNotesHeader')}</h2>
                            <div style="padding: 10px; white-space: pre-line;">${minutesData.notes}</div>
                        </div>` : ''}
                    
                    ${minutesData.preparer ?
                            `<div style="margin-top: 30px; text-align: right; font-style: italic;">
                            ${Lang.get('documentGeneratorMinutesPreparedBy')} ${minutesData.preparer}
                        </div>` : ''}
                </div>`;
                }
                break;
        }

        return content;
    }

    // Email the generated document content
    emailDocument(content, templateType) {
        //console.log(`Paperwork: Emailing ${templateType} document`);

        // Get recipient data from localStorage
        this.getSavedRecipientData(templateType).then(recipientInfo => {
            let emailSubject = "";

            // For business letters, use the subject from localStorage
            if (templateType === 'business-letter' && recipientInfo?.subject) {
                emailSubject = recipientInfo.subject;
            } else if (templateType === 'contract' && recipientInfo?.title) {
                emailSubject = recipientInfo.title;
            } else if (templateType === 'memo' && recipientInfo?.subject) {
                emailSubject = `Memo: ${recipientInfo.subject}`;
            } else if (templateType === 'proposal' && recipientInfo?.title) {
                emailSubject = recipientInfo.title;
            } else if (templateType === 'meeting-minutes' && recipientInfo?.title) {
                emailSubject = `Meeting Minutes: ${recipientInfo.title} - ${recipientInfo.date}`;
            } else {
                emailSubject = `Your ${templateType.replace('-', ' ')}`;
            }

            try {
                // Create mailto link with just the subject and body
                const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(content)}`;

                // Use multiple approaches to open the email client
                // Option 1: Try window.location approach first
                const mailtoTest = document.createElement('a');
                mailtoTest.href = mailtoLink;
                mailtoTest.style.display = 'none';
                document.body.appendChild(mailtoTest);

                // Use click() to trigger the mailto link
                mailtoTest.click();

                // Clean up
                setTimeout(() => {
                    document.body.removeChild(mailtoTest);
                }, 100);

                //console.log('Email client opened via mailto link');
            } catch (error) {
                console.error('Error opening email client:', error);

                // Fallback: Show instructions to the user
                alert(Lang.get('documentGeneratorEmailError'));

                // Copy content to clipboard as a fallback
                try {
                    navigator.clipboard.writeText(content).then(() => {
                        //console.log('Content copied to clipboard as fallback');
                    });
                } catch (clipboardError) {
                    console.error('Failed to copy to clipboard:', clipboardError);
                }
            }
        });
    }

    // Save letter data to localStorage with encryption
    async saveLetterData(templateType) {
        const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');

        if (templateType === 'business-letter') {
            // Get all field values
            const letterData = {
                location: document.getElementById('location-info')?.value || '',
                date: document.getElementById('letter-date')?.value || '',
                recipient: document.getElementById('recipient-info')?.value || '',
                subject: document.getElementById('letter-subject')?.value || '',
                greeting: document.getElementById('letter-greeting')?.value || '',
                body: document.getElementById('letter-body')?.value || '',
                tone: document.getElementById('letter-tone')?.value || 'professional',
                closing: document.getElementById('letter-closing')?.value || '',
                signature: document.getElementById('letter-signature')?.value || ''
            };

            // Encrypt and store
            const encryptedData = await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(letterData));
            localStorage.setItem(`letterData_${templateType}`, JSON.stringify(encryptedData));
        } else if (templateType === 'contract') {
            // Get all contract field values
            const contractData = {
                type: document.getElementById('contract-type')?.value || 'service',
                title: document.getElementById('contract-title')?.value || '',
                party1: document.getElementById('party1-info')?.value || '',
                party2: document.getElementById('party2-info')?.value || '',
                date: document.getElementById('contract-date')?.value || '',
                term: document.getElementById('contract-term')?.value || '',
                scope: document.getElementById('contract-scope')?.value || '',
                payment: document.getElementById('contract-payment')?.value || '',
                confidentiality: document.getElementById('contract-confidentiality')?.value || '',
                ip: document.getElementById('contract-ip')?.value || '',
                termination: document.getElementById('contract-termination')?.value || '',
                disputes: document.getElementById('contract-disputes')?.value || '',
                terms: document.getElementById('contract-terms')?.value || ''
            };

            // Encrypt and store
            const encryptedData = await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(contractData));
            localStorage.setItem(`letterData_${templateType}`, JSON.stringify(encryptedData));
        } else if (templateType === 'proposal') {
            // Get all proposal field values
            const proposalData = {
                companyInfo: document.getElementById('company-info')?.value || '',
                clientInfo: document.getElementById('client-info')?.value || '',
                title: document.getElementById('proposal-title')?.value || '',
                type: document.getElementById('proposal-type')?.value || 'product',
                summary: document.getElementById('proposal-summary')?.value || '',
                problemStatement: document.getElementById('problem-statement')?.value || '',
                solution: document.getElementById('proposed-solution')?.value || '',
                deliverables: document.getElementById('deliverables')?.value || '',
                timeline: document.getElementById('timeline')?.value || '',
                pricing: document.getElementById('pricing')?.value || '',
                team: document.getElementById('team-qualifications')?.value || '',
                caseStudies: document.getElementById('case-studies')?.value || '',
                callToAction: document.getElementById('call-to-action')?.value || '',
                termsConditions: document.getElementById('terms-conditions')?.value || '',
                style: document.getElementById('proposal-style')?.value || 'professional'
            };

            // Encrypt and store
            const encryptedData = await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(proposalData));
            localStorage.setItem(`letterData_${templateType}`, JSON.stringify(encryptedData));
        } else if (templateType === 'memo') {
            // Get all memo field values
            const memoData = {
                companyInfo: document.getElementById('memo-company-info')?.value || '',
                date: document.getElementById('memo-date')?.value || '',
                to: document.getElementById('memo-to')?.value || '',
                from: document.getElementById('memo-from')?.value || '',
                subject: document.getElementById('memo-subject')?.value || '',
                body: document.getElementById('memo-body')?.value || '',
                tone: document.getElementById('memo-tone')?.value || 'professional',
                attachments: document.getElementById('memo-attachments')?.value || '',
            };

            // Encrypt and store
            const encryptedData = await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(memoData));
            localStorage.setItem(`letterData_${templateType}`, JSON.stringify(encryptedData));
        } else if (templateType === 'meeting-minutes') {
            // Get all meeting minutes field values
            const minutesData = {
                orgName: document.getElementById('minutes-org-name')?.value || '',
                title: document.getElementById('minutes-title')?.value || '',
                date: document.getElementById('minutes-date')?.value || '',
                time: document.getElementById('minutes-time')?.value || '',
                location: document.getElementById('minutes-location')?.value || '',
                facilitator: document.getElementById('minutes-facilitator')?.value || '',
                attendees: document.getElementById('minutes-attendees')?.value || '',
                absent: document.getElementById('minutes-absent')?.value || '',
                agenda: document.getElementById('minutes-agenda')?.value || '',
                discussion: document.getElementById('minutes-discussion')?.value || '',
                decisions: document.getElementById('minutes-decisions')?.value || '',
                actions: document.getElementById('minutes-actions')?.value || '',
                nextDate: document.getElementById('minutes-next-date')?.value || '',
                nextTime: document.getElementById('minutes-next-time')?.value || '',
                notes: document.getElementById('minutes-notes')?.value || '',
                preparer: document.getElementById('minutes-preparer')?.value || '',
                style: document.getElementById('minutes-style')?.value || 'formal'
            };

            // Encrypt and store
            const encryptedData = await PaiperworkDB.encrypt(hashedMasterKey, JSON.stringify(minutesData));
            localStorage.setItem(`letterData_${templateType}`, JSON.stringify(encryptedData));
        }
    }

    // Load letter data from localStorage with decryption
    async loadLetterData(templateType) {
        try {
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
            const savedData = localStorage.getItem(`letterData_${templateType}`);

            if (savedData) {
                // Decrypt the data
                const encryptedData = JSON.parse(savedData);
                const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);
                if (decryptedDataStr) {
                    const letterData = JSON.parse(decryptedDataStr);

                    // For business letters
                    if (templateType === 'business-letter') {
                        document.getElementById('location-info').value = letterData.location || '';
                        document.getElementById('letter-date').value = letterData.date || new Date().toISOString().split('T')[0];
                        document.getElementById('recipient-info').value = letterData.recipient || '';
                        document.getElementById('letter-subject').value = letterData.subject || '';
                        document.getElementById('letter-greeting').value = letterData.greeting || Lang.get('documentGeneratorGreetingDefault1');
                        document.getElementById('letter-body').value = letterData.body || '';
                        document.getElementById('letter-tone').value = letterData.tone || 'professional';
                        document.getElementById('letter-closing').value = letterData.closing || Lang.get('documentGeneratorClosingDefault1');
                        document.getElementById('letter-signature').value = letterData.signature || '';
                    } else if (templateType === 'contract') {
                        // For contracts
                        document.getElementById('contract-type').value = letterData.type || 'service';
                        document.getElementById('contract-title').value = letterData.title || '';
                        document.getElementById('party1-info').value = letterData.party1 || '';
                        document.getElementById('party2-info').value = letterData.party2 || '';
                        document.getElementById('contract-date').value = letterData.date || new Date().toISOString().split('T')[0];
                        document.getElementById('contract-term').value = letterData.term || '';
                        document.getElementById('contract-scope').value = letterData.scope || '';
                        document.getElementById('contract-payment').value = letterData.payment || '';
                        document.getElementById('contract-confidentiality').value = letterData.confidentiality || '';
                        document.getElementById('contract-ip').value = letterData.ip || '';
                        document.getElementById('contract-termination').value = letterData.termination || '';
                        document.getElementById('contract-disputes').value = letterData.disputes || '';
                        document.getElementById('contract-terms').value = letterData.terms || '';
                    } else if (templateType === 'proposal') {
                        // For proposals
                        document.getElementById('company-info').value = letterData.companyInfo || '';
                        document.getElementById('client-info').value = letterData.clientInfo || '';
                        document.getElementById('proposal-title').value = letterData.title || '';
                        document.getElementById('proposal-type').value = letterData.type || 'services';
                        document.getElementById('proposal-summary').value = letterData.summary || '';
                        document.getElementById('problem-statement').value = letterData.problemStatement || '';
                        document.getElementById('proposed-solution').value = letterData.solution || '';
                        document.getElementById('deliverables').value = letterData.deliverables || '';
                        document.getElementById('timeline').value = letterData.timeline || '';
                        document.getElementById('pricing').value = letterData.pricing || '';
                        document.getElementById('team-qualifications').value = letterData.team || '';
                        document.getElementById('case-studies').value = letterData.caseStudies || '';
                        document.getElementById('call-to-action').value = letterData.callToAction || '';
                        document.getElementById('terms-conditions').value = letterData.termsConditions || '';
                        document.getElementById('proposal-style').value = letterData.style || 'professional';
                    } else if (templateType === 'memo') {
                        // For memos
                        document.getElementById('memo-company-info').value = letterData.companyInfo || '';
                        document.getElementById('memo-date').value = letterData.date || new Date().toISOString().split('T')[0];
                        document.getElementById('memo-to').value = letterData.to || '';
                        document.getElementById('memo-from').value = letterData.from || '';
                        document.getElementById('memo-subject').value = letterData.subject || '';
                        document.getElementById('memo-body').value = letterData.body || '';
                        document.getElementById('memo-tone').value = letterData.tone || 'professional';
                        document.getElementById('memo-attachments').value = letterData.attachments || '';
                    } else if (templateType === 'meeting-minutes') {
                        // For meeting minutes
                        document.getElementById('minutes-org-name').value = letterData.orgName || '';
                        document.getElementById('minutes-title').value = letterData.title || '';
                        document.getElementById('minutes-date').value = letterData.date || new Date().toISOString().split('T')[0];
                        document.getElementById('minutes-time').value = letterData.time || new Date().toTimeString().split(' ')[0].substring(0, 5);
                        document.getElementById('minutes-location').value = letterData.location || '';
                        document.getElementById('minutes-facilitator').value = letterData.facilitator || '';
                        document.getElementById('minutes-attendees').value = letterData.attendees || '';
                        document.getElementById('minutes-absent').value = letterData.absent || '';
                        document.getElementById('minutes-agenda').value = letterData.agenda || '';
                        document.getElementById('minutes-discussion').value = letterData.discussion || '';
                        document.getElementById('minutes-decisions').value = letterData.decisions || '';
                        document.getElementById('minutes-actions').value = letterData.actions || '';
                        document.getElementById('minutes-next-date').value = letterData.nextDate || '';
                        document.getElementById('minutes-next-time').value = letterData.nextTime || '';
                        document.getElementById('minutes-notes').value = letterData.notes || '';
                        document.getElementById('minutes-preparer').value = letterData.preparer || '';
                        document.getElementById('minutes-style').value = letterData.style || 'formal';
                    }
                    // Add similar blocks for other document types as needed
                }
            }
        } catch (error) {
            console.error('Error loading letter data:', error);
            // Continue without saved data if there's an error
        }
    }

    // Load letter data from localStorage with decryption
    async getSavedRecipientData(templateType) {
        try {
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
            const savedData = localStorage.getItem(`letterData_${templateType}`);

            if (savedData) {
                const encryptedData = JSON.parse(savedData);
                const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);

                if (decryptedDataStr) {
                    // Store each template type in its own memory to prevent mixing
                    return JSON.parse(decryptedDataStr);
                }
            }
            return null;
        } catch (error) {
            console.error('Error loading recipient data:', error);
            return null;
        }
    }

    // Closes the floating window
    goBackToEditor(templateType) {
        this.closeFloatingWindow();

        setTimeout(() => {
            this.showDocumentEditor(templateType);
        }, 300);
    }

    // Generates a unique ID string
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    //Opens a floating window with the document editor
    showDocumentPreview(templateType) {
        //console.log('Starting showDocumentPreview for:', templateType);
        window.currentTemplateType = templateType;
        let title;
        switch (templateType) {
            case 'business-letter':
                title = Lang.get('documentGeneratorBusinessLetterPreview');
                break;
            case 'contract':
                title = Lang.get('documentGeneratorContractPreview');
                break;
            case 'proposal':
                title = Lang.get('documentGeneratorProposalPreview');
                break;
            case 'memo':
                title = Lang.get('documentGeneratorMemoPreview');
                break;
            case 'meeting-minutes':
                title = Lang.get('documentGeneratorMeetingMinutesPreview');
                break;
            default:
                title = Lang.get('documentGeneratorDocumentPreview');
        }

        // Get location and date from localStorage instead of form fields
        let location = '';
        let formattedDate = '';
        let documentBody = '';


        // Get saved letter data from localStorage
        const getSavedLetterData = async () => {
                        // Declare bodyContent and minutesHeader here so they're available after the try/catch
            let bodyContent = '';
            let minutesHeader = '';
            try {
                const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
                const savedData = localStorage.getItem(`letterData_${templateType}`);

                if (savedData) {
                    // Decrypt the data
                    const encryptedData = JSON.parse(savedData);
                    const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);

                    if (decryptedDataStr) {
                        const letterData = JSON.parse(decryptedDataStr);

                        if (templateType === 'business-letter') {
                            // Get location directly from saved data
                            location = letterData.location || '';
                            //console.log('Loaded location from storage:', location);

                            // Format date from saved data
                            const date = letterData.date || '';
                            if (date && date.includes('-')) {
                                formattedDate = this.formatDateForRegion(date);
                            } else {
                                formattedDate = date;
                            }
                            //console.log('Loaded formatted date from storage:', formattedDate);
                        } else if (templateType === 'contract') {
                            // For contracts, we only need the date for header info
                            const date = letterData.date || '';
                            if (date && date.includes('-')) {
                                formattedDate = this.formatDateForRegion(date);
                            } else {
                                formattedDate = date;
                            }
                            //console.log('Loaded contract date from storage:', formattedDate);
                        } else if (templateType === 'proposal') {
                            // For proposals, we might want to extract the date for the header
                            formattedDate = this.formatDateForRegion(new Date()) || '';
                        } else if (templateType === 'meeting-minutes') {
                            // For meeting minutes, we might want to add a header
                            try {
                                const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
                                const savedData = localStorage.getItem(`letterData_${templateType}`);
                                if (savedData) {
                                    const encryptedData = JSON.parse(savedData);
                                    const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);
                                    if (decryptedDataStr) {
                                        const minutesData = JSON.parse(decryptedDataStr);

                                        // Format the date
                                        let formattedDate = minutesData.date;
                                        if (minutesData.date && minutesData.date.includes('-')) {
                                            const dateObj = new Date(minutesData.date);
                                            formattedDate = this.formatDateForRegion(minutesData.date);
                                        }

                                        // Create a simple header for the meeting minutes preview and store it
                                        minutesHeader = `${minutesData.title || 'MEETING MINUTES'}\n\nDate: ${formattedDate} ${minutesData.time || ''}\nLocation: ${minutesData.location || ''}\nFacilitator: ${minutesData.facilitator || ''}\n\nAttendees:\n${minutesData.attendees || ''}\n\n`;

                                        // Keep bodyContent as the (yet-to-be-extracted) document body; we'll prepend the header after extraction
                                        bodyContent = documentBody;
                                    } else {
                                        bodyContent = documentBody;
                                    }
                                } else {
                                    bodyContent = documentBody;
                                }
                            } catch (error) {
                                console.error('Error formatting meeting minutes preview:', error);
                                bodyContent = documentBody;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading letter data from storage:', error);
            }

            // Extract content from documentContent based on template type
            //console.log('Extracting content from documentContent');
            if (this.documentContent) {
                if (templateType === 'business-letter') {
                    if (this.documentContent.includes('<div style="white-space: pre-line;">')) {
                        const bodyMatch = this.documentContent.match(/<div style="white-space: pre-line;">([\s\S]*?)<\/div>/);
                        if (bodyMatch && bodyMatch[1]) {
                            documentBody = bodyMatch[1];
                            //console.log('Successfully extracted letter body');
                        }
                    }
                } else if (templateType === 'contract') {
                    // For contracts, extract from the text-align: justify div
                    if (this.documentContent.includes('<div style="white-space: pre-line; text-align: justify;">')) {
                        const bodyMatch = this.documentContent.match(/<div style="white-space: pre-line; text-align: justify;">([\s\S]*?)<\/div>/);
                        if (bodyMatch && bodyMatch[1]) {
                            // For contracts, include the title in the display
                            const titleMatch = this.documentContent.match(/<h2 style="text-transform: uppercase; letter-spacing: 1px;">(.*?)<\/h2>/);
                            const title = titleMatch && titleMatch[1] ? titleMatch[1] : '';

                            documentBody = `${title}\n\n${Lang.get('documentGeneratorEffectiveDateLabel')} ${formattedDate}\n\n${bodyMatch[1]}`;
                            //console.log('Successfully extracted contract body');
                        }
                    }
                } else if (templateType === 'proposal') {
                    // Extract proposal content from the white-space: pre-line div
                    if (this.documentContent.includes('<div style="white-space: pre-line; text-align: justify;">')) {
                        const bodyMatch = this.documentContent.match(/<div style="white-space: pre-line; text-align: justify;">([\s\S]*?)<\/div>/);
                        if (bodyMatch && bodyMatch[1]) {
                            documentBody = bodyMatch[1];
                            //console.log('Successfully extracted proposal body');
                        }
                    }
                } else if (templateType === 'memo') {
                    // For memos, extract the body content from the justifiable text div
                    if (this.documentContent.includes('<div style="padding: 0 10px; white-space: pre-line; text-align: justify; line-height: 1.5;">')) {
                        const bodyMatch = this.documentContent.match(/<div style="padding: 0 10px; white-space: pre-line; text-align: justify; line-height: 1.5;">([\s\S]*?)<\/div>/);
                        if (bodyMatch && bodyMatch[1]) {
                            documentBody = bodyMatch[1];
                            //console.log('Successfully extracted memo body');
                        }
                    }

                } else if (templateType === 'meeting-minutes') {
                     // For meeting minutes, parse the AI-generated HTML using DOM methods
                    // to preserve block structure and spacing (similar approach to business-letter)
                    try {
                        if (this.documentContent) {
                            // Create a temporary container and set the HTML
                            const tmp = document.createElement('div');
                            tmp.innerHTML = this.documentContent;

                            // Remove scripts/styles if present
                            tmp.querySelectorAll('script,style').forEach(n => n.remove());

                            // Get the visible text with preserved block breaks using innerText
                            let extractedText = tmp.innerText || tmp.textContent || '';

                            // Normalize line endings and collapse excessive blank lines
                            extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

                            documentBody = extractedText;
                        }
                    } catch (err) {
                        console.error('Error extracting meeting-minutes via DOM, falling back to regex cleanup:', err);
                        // Fallback: use the raw content as-is
                        documentBody = this.documentContent || '';
                    }
                }
            }
            // Create final content for display
            //console.log('Creating bodyContent for display');
            // Use a single displayBodyContent variable so earlier values (e.g. meeting-minutes header)
            // set above are not accidentally shadowed.
            let displayBodyContent = bodyContent || '';

            if (templateType === 'business-letter') {
                displayBodyContent = `${location}\n${formattedDate}\n\n${documentBody}`;
            } else if (templateType === 'contract') {
                displayBodyContent = documentBody;
            } else if (templateType === 'memo') {
                // For memos, we should include some header info from saved data
                try {
                    const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
                    const savedData = localStorage.getItem(`letterData_${templateType}`);
                    if (savedData) {
                        const encryptedData = JSON.parse(savedData);
                        const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);
                        if (decryptedDataStr) {
                            const memoData = JSON.parse(decryptedDataStr);
                            // Add a simple header for the memo preview
                            const memoHeader = `MEMORANDUM\n\nDATE: ${formattedDate}\nTO: ${memoData.to || ''}\nFROM: ${memoData.from || ''}\nSUBJECT: ${memoData.subject || ''}\n${memoData.attachments ? `ATTACHMENTS: ${memoData.attachments}\n` : ''}\n`;
                            displayBodyContent = memoHeader + documentBody;
                        } else {
                            displayBodyContent = documentBody;
                        }
                    } else {
                        bodyContent = documentBody;
                    }
                } catch (error) {
                    console.error('Error formatting memo preview:', error);
                    bodyContent = documentBody;
                }
            } else if (templateType === 'proposal') {
                // For proposals, we might want to add a simple header
                try {
                    const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('letterData');
                    const savedData = localStorage.getItem(`letterData_${templateType}`);
                    if (savedData) {
                        const encryptedData = JSON.parse(savedData);
                        const decryptedDataStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedData);
                        if (decryptedDataStr) {
                            const proposalData = JSON.parse(decryptedDataStr);
                            // Add a simple header for the proposal preview
                            const proposalHeader = `${proposalData.title || 'BUSINESS PROPOSAL'}\n\nPrepared: ${formattedDate}\nPrepared by: ${proposalData.companyInfo ? proposalData.companyInfo.split('\n')[0] : ''}\nPrepared for: ${proposalData.clientInfo ? proposalData.clientInfo.split('\n')[0] : ''}\n\n`;
                            displayBodyContent = proposalHeader + documentBody;
                        } else {
                            displayBodyContent = documentBody;
                        }
                    } else {
                         displayBodyContent = documentBody;
                    }
                } catch (error) {
                    console.error('Error formatting proposal preview:', error);
                         displayBodyContent = documentBody;
                }
                } else {
                // Default case for other document types
                displayBodyContent = documentBody;
            }

                    // Debug logs to inspect meeting-minutes content flow
            try {
                //console.debug('DEBUG: this.documentContent (raw):', this.documentContent);
                //console.debug('DEBUG: minutesHeader:', minutesHeader);
                //console.debug('DEBUG: documentBody (after extraction/cleanup):', documentBody);
                //console.debug('DEBUG: displayBodyContent (final):', displayBodyContent);
            } catch (e) {
                // Non-fatal: console may be undefined in some environments
            }

            // Create the UI with the simplified toggle approach

            // Normalize excessive blank lines and whitespace:
            // - unify CRLF to LF
            // - strip leading/trailing spaces on each line
            // - collapse any run of 3+ newline/whitespace-only lines into exactly two newlines
            try {
                displayBodyContent = String(displayBodyContent).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                // Remove leading/trailing spaces on each line
                displayBodyContent = displayBodyContent.replace(/^[ \t]+/gm, '').replace(/[ \t]+$/gm, '');
                // Collapse runs of 3+ newline+optional-space sequences to exactly two newlines
                displayBodyContent = displayBodyContent.replace(/(\n[ \t\f\v]*){3,}/g, '\n\n');
                // Safety: also collapse plain 3+ newlines
                displayBodyContent = displayBodyContent.replace(/\n{3,}/g, '\n\n');
                displayBodyContent = displayBodyContent.trim();
            } catch (e) {
                // ignore if displayBodyContent is not a string
            }

            // Create a formatted version of the content with Markdown converted to HTML
            const formattedContent = this.convertMarkdownToHTML(displayBodyContent);

            this.showFloatingWindow(
                title,
                `
                <div style="max-width: 100%;">
                    <!-- Initially show the formatted preview -->
                    <div id="preview-container" style="display: block;">
                        <div id="formatted-preview" class="formatted-document" style="min-height: 400px; width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); padding: 15px; overflow-y: auto; background-color: var(--document-bg, white); color: var(--document-text, #333); font-family: 'Times New Roman', Times, serif;">
                            ${formattedContent}
                        </div>
                    </div>
                    
                    <!-- Initially hidden text editor -->
                    <div id="editor-container" style="display: none;">
                        <textarea id="document-editor" class="paperwork-textarea" style="min-height: 400px; width: 100%; box-sizing: border-box; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; padding: 15px; background-color: var(--input-bg, white); color: var(--text-color, #333); border: 1px solid var(--border-color, #ddd);">${displayBodyContent}</textarea>
                    </div>
                    
                </div>
                `,
                [
                    {
                        text: Lang.get('documentGeneratorGoBack'),
                        type: 'primary',
                        action: () => this.goBackToEditor(templateType),
                        position: 'left'
                    },
                    // Update the email button visibility logic in the toggle button action

                    {
                        text: Lang.get('documentGeneratorEditText'),
                        type: 'primary',
                        id: 'toggle-edit-btn',
                        position: 'center',
                        action: function (event) {
                            const toggleButton = event.target;
                            const previewContainer = document.getElementById('preview-container');
                            const editorContainer = document.getElementById('editor-container');
                            const editor = document.getElementById('document-editor');

                            // First make sure critical elements exist
                            if (!previewContainer || !editorContainer || !editor) {
                                console.error('Missing required elements for document editing');
                                return;
                            }

                            // Check which mode we're currently in
                            const isEditorVisible = editorContainer.style.display === 'block';

                            if (isEditorVisible) {
                                // Switch to preview mode
                                editorContainer.style.display = 'none';
                                previewContainer.style.display = 'block';
                                toggleButton.textContent = Lang.get('documentGeneratorEditText');

                                // Update the preview with the edited content
                                const formattedPreview = document.getElementById('formatted-preview');
                                if (formattedPreview) {
                                    if (window.paperworkInstance && window.paperworkInstance.documentGenerator) {
                                        formattedPreview.innerHTML = window.paperworkInstance.documentGenerator.convertMarkdownToHTML(editor.value);
                                    } else {
                                        formattedPreview.innerHTML = editor.value;
                                    }
                                }



                            } else {
                                // Handle template-specific header preservation code here...
                                // [keep existing memo and meeting-minutes logic]

                                // Switch to editor mode
                                previewContainer.style.display = 'none';
                                editorContainer.style.display = 'block';
                                toggleButton.textContent = Lang.get('documentGeneratorShowFormattedText');


                            }
                        }
                    },
                    {
                        text: Lang.get('documentGeneratorCopyText'),
                        type: 'secondary',
                        id: 'copy-btn',
                        action: function () {
                            //console.log('Copy button clicked');

                            // Get the current mode
                            const editorContainer = document.getElementById('editor-container');
                            const isEditorVisible = editorContainer.style.display === 'block';

                            // Get the current content from the document editor
                            const editor = document.getElementById('document-editor');
                            const rawText = editor ? editor.value : '';

                            if (!rawText) {
                                console.error('No text available to copy');
                                return;
                            }

                            // Use the new helper method to format text - this copies as HTML
                            const textToCopy = window.paperworkInstance.documentGenerator.formatTextForExport(rawText, true);
                            //console.log('Formatted content to copy:', textToCopy);

                            // Create a temporary element for HTML copying
                            const tempElement = document.createElement('div');
                            tempElement.innerHTML = textToCopy;
                            tempElement.style.position = 'absolute';
                            tempElement.style.left = '-9999px';
                            document.body.appendChild(tempElement);

                            // Select the temp element's contents
                            const range = document.createRange();
                            range.selectNode(tempElement);
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);

                            // Execute copy command
                            try {
                                const successful = document.execCommand('copy');
                                if (successful) {
                                    //console.log('Formatted text copied to clipboard');

                                    // Show success feedback directly on this button
                                    const self = this; // Get reference to the button
                                    const originalText = self.textContent;

                                    // Change button text temporarily
                                    self.textContent = Lang.get('documentGeneratorCopied');
                                    self.style.backgroundColor = '#4CAF50';

                                    // Reset after 2 seconds
                                    setTimeout(() => {
                                        self.textContent = originalText;
                                        self.style.backgroundColor = '';
                                    }, 2000);
                                } else {
                                    // Fallback to plain text copy if HTML copy fails
                                    navigator.clipboard.writeText(window.paperworkInstance.documentGenerator.formatTextForExport(rawText, false))
                                        .then(() => {
                                            //console.log('Plain text copied to clipboard (fallback)');

                                            // Show success feedback
                                            const self = this;
                                            const originalText = self.textContent;
                                            self.textContent = Lang.get('documentGeneratorCopiedPlainText');
                                            self.style.backgroundColor = '#4CAF50';
                                            setTimeout(() => {
                                                self.textContent = originalText;
                                                self.style.backgroundColor = '';
                                            }, 2000);
                                        });
                                }
                            } catch (err) {
                                console.error('Error copying formatted text:', err);

                                // Fallback to plain text
                                navigator.clipboard.writeText(window.paperworkInstance.documentGenerator.formatTextForExport(rawText, false))
                                    .then(() => {
                                        //console.log('Plain text copied to clipboard as fallback');
                                        alert('Formatted copy failed. Plain text copied instead.');
                                    })
                                    .catch(clipErr => {
                                        console.error('All copy methods failed:', clipErr);
                                        alert('Failed to copy text. Please try again.');
                                    });
                            }

                            // Clean up
                            document.body.removeChild(tempElement);
                            selection.removeAllRanges();
                        }
                    },
                    {
                        text: Lang.get('documentGeneratorEmailIt'),
                        type: 'secondary',
                        id: 'email-btn',
                        action: function () {
                            // Make sure we get the editor content regardless of which mode we're in
                            const editor = document.getElementById('document-editor');
                            const rawContent = editor ? editor.value : '';

                            if (!rawContent) {
                                console.error('No text available to email');
                                alert('No content available to email. Please try again.');
                                return;
                            }

                            // Log the raw content for debugging
                            //console.log('Raw content for email:', rawContent);

                            // Get the template type
                            window.currentTemplateType = window.currentTemplateType || 'business-letter';
                            const templateType = window.currentTemplateType;
                            //console.log('Template type for email:', templateType);

                            // Get the plain text formatted content for emailing
                            const emailContent = window.paperworkInstance.documentGenerator.formatTextForExport(
                                rawContent,
                                false, // Always use plain text for email body
                                false  // Remove markdown formatting
                            );

                            // Make sure paperworkInstance exists
                            if (!window.paperworkInstance) {
                                console.error('Missing paperworkInstance');
                                alert('Error: Could not access required components. Please try again.');
                                return;
                            }

                            // Send the email using the document generator instance
                            if (window.paperworkInstance.documentGenerator) {
                                window.paperworkInstance.documentGenerator.emailDocument(emailContent, templateType);
                            } else {
                                console.error('Cannot access documentGenerator instance');
                                alert('Error: Could not prepare email. Please try again.');
                            }
                        }
                    },

                    {
                        text: Lang.get('documentGeneratorClose'),
                        type: 'secondary',
                        action: () => this.closeFloatingWindow()
                    }
                ]
            );
            setTimeout(() => {
                const emailButton = document.getElementById('email-btn');
                const copyButton = document.getElementById('copy-btn');

                // If we're starting in preview mode (which is the default), both buttons should be visible
                if (emailButton) {
                    emailButton.style.display = 'inline-block';
                    emailButton.style.visibility = 'visible';
                    emailButton.style.opacity = '1';
                    //console.log('Email button should be visible initially');
                }

                if (copyButton) {
                    copyButton.style.display = 'inline-block';
                    copyButton.style.visibility = 'visible';
                    copyButton.style.opacity = '1';
                    //console.log('Copy button should be visible initially');
                }

                //console.log('Initial UI states set');
            }, 100);
        };

        // Execute the async function to get data and show window
        getSavedLetterData();

        //console.log('showDocumentPreview initiated');
    }

    // Convert Markdown to HTML with updated regex for headings
    convertMarkdownToHTML(text) {
        if (!text) return '';

        //console.log('Converting markdown to HTML, input:', text);

        // Trim the text to remove excess whitespace at beginning and end
        text = text.trim();
        // Convert Markdown to HTML
        let html = text;

        // UPDATED REGEX: Allow for leading whitespace before the heading markers
        html = html.replace(/^[ \t]*(#{1,6})[ \t]*(.+?)[ \t]*$/gm, function (match, hashes, text) {
            const level = hashes.length;
            const trimmedText = text.trim();
            //console.log(`Heading match found: level=${level}, text="${trimmedText}"`);
            return `<h${level}>${trimmedText}</h${level}>`;
        });

        // Rest of your existing code for bold, italics, etc.
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<u>$1</u>');
        html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
        html = html.replace(/<li>(.*?)<\/li>(\s*<li>)/g, '<li>$1</li>$2');
        html = html.replace(/(^<li>.*?<\/li>)/g, '<ul>$1</ul>');
        html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>');
        html = html.replace(/\n/g, '<br>');

        //console.log('Converted output:', html);

        return html;
    }

    // Format text for export, handling plain text cases
    formatTextForExport(rawContent, isHTML = false, keepMarkdown = false) {
        if (!rawContent) return '';

        // If we want HTML output
        if (isHTML) {
            // Start with a wrapper div with basic styling - adding color: black to ensure text is visible
            let formattedHTML = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; color: #000000;">`;

            // Split content by lines for processing
            const lines = rawContent.split('\n');
            let inSection = false;
            let inList = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines
                if (!line) {
                    formattedHTML += '<br>';
                    continue;
                }

                // Handle headers
                if (line.startsWith('# ')) {
                    const headerText = line.substring(2);
                    formattedHTML += `<h1 style="color: #000000; font-size: 1.5em; margin: 0.83em 0;">${headerText}</h1>`;
                    continue;
                }

                if (line.startsWith('## ')) {
                    const headerText = line.substring(3);
                    formattedHTML += `<h2 style="color: #000000; font-size: 1.3em; margin: 0.83em 0;">${headerText}</h2>`;
                    continue;
                }

                if (line.startsWith('### ')) {
                    const headerText = line.substring(4);
                    formattedHTML += `<h3 style="color: #000000; font-size: 1.1em; margin: 0.83em 0;">${headerText}</h3>`;
                    continue;
                }

                // Handle lists
                if (line.startsWith('- ') || line.startsWith('• ') || /^\d+\./.test(line)) {
                    if (!inList) {
                        formattedHTML += '<ul style="margin: 1em 0; padding-left: 40px;">';
                        inList = true;
                    }

                    // Process inline formatting for list items
                    let content = line.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '');
                    content = this.formatInlineStyles(content);

                    formattedHTML += `<li style="margin-bottom: 0.5em; color: #000000;">${content}</li>`;
                    continue;
                } else if (inList) {
                    formattedHTML += '</ul>';
                    inList = false;
                }

                // Handle normal paragraphs with inline formatting
                formattedHTML += `<p style="margin: 1em 0; line-height: 1.5; color: #000000;">${this.formatInlineStyles(line)}</p>`;
            }

            // Close any open tags
            if (inList) formattedHTML += '</ul>';
            if (inSection) formattedHTML += '</div>';

            formattedHTML += '</div>';

            // Log the formatted HTML for debugging
            //console.log('Formatted HTML for export:', formattedHTML);

            return formattedHTML;
        }
        // If we want plain text but with markdown removed
        else if (!keepMarkdown) {
            // Process the text to remove markdown formatting
            let plainText = rawContent
                // Remove header formatting
                .replace(/^# (.*?)$/gm, '$1')
                .replace(/^## (.*?)$/gm, '$1')
                .replace(/^### (.*?)$/gm, '$1')
                .replace(/^#### (.*?)$/gm, '$1')
                // Remove bold formatting
                .replace(/\*\*(.*?)\*\*/g, '$1')
                // Remove italic formatting
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/_(.*?)_/g, '$1')
                // Remove underline formatting
                .replace(/__(.*?)__/g, '$1')
                // Convert bullet points to plain text with standard bullets
                .replace(/^\- (.*?)$/gm, '• $1')
                // Handle numbered lists (preserve numbers)
                .replace(/^(\d+)\. (.*?)$/gm, '$1. $2');

            //console.log('Formatted plain text for export:', plainText);
            return plainText;
        }
        // Keep markdown intact
        else {
            return rawContent;
        }
    }

    // Helper method for inline styles formatting
    formatInlineStyles(text) {
        // Process bold - using CSS variables for theme compatibility
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: var(--document-text, #000000);">$1</strong>');

        // Process italics
        text = text.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: var(--document-text, #000000);">$1</em>');
        text = text.replace(/_(.*?)_/g, '<em style="font-style: italic; color: var(--document-text, #000000);">$1</em>');

        // Process underline
        text = text.replace(/__(.*?)__/g, '<u style="text-decoration: underline; color: var(--document-text, #000000);">$1</u>');

        return text;
    }

    // Update emailDocument method to treat all document types consistently
    emailDocument(content, templateType, isHTML = false) {
        //console.log(`Paperwork: Emailing ${templateType} document`);

        // Get recipient data from localStorage
        this.getSavedRecipientData(templateType).then(recipientInfo => {
            let emailSubject = "";

            // Use type-specific subject lines based on document type
            if (templateType === 'business-letter' && recipientInfo?.subject) {
                emailSubject = recipientInfo.subject;
            } else if (templateType === 'contract' && recipientInfo?.title) {
                emailSubject = recipientInfo.title;
            } else if (templateType === 'memo' && recipientInfo?.subject) {
                emailSubject = `Memo: ${recipientInfo.subject}`;
            } else if (templateType === 'proposal' && recipientInfo?.title) {
                emailSubject = recipientInfo.title;
            } else if (templateType === 'meeting-minutes' && recipientInfo?.title) {
                emailSubject = `Meeting Minutes: ${recipientInfo.title} - ${recipientInfo.date}`;
            } else {
                emailSubject = `Your ${templateType.replace('-', ' ')}`;
            }

            try {
                // For ALL document types, convert to plain text and include directly in email body
                const plainTextContent = this.formatTextForExport(content, false, false);
                const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(plainTextContent)}`;

                this.openEmailClient(mailtoLink);
                //console.log('Email client opened successfully');

            } catch (error) {
                console.error('Error opening email client:', error);

                // Fallback: Copy content to clipboard and show instructions
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    const fallbackContent = this.formatTextForExport(content, false, false);
                    navigator.clipboard.writeText(fallbackContent).then(() => {
                        alert('Unable to open email client automatically.\n\nThe document content has been copied to your clipboard. Please open your email client manually and paste the content.');
                    }).catch(clipboardError => {
                        console.error('Failed to copy to clipboard:', clipboardError);
                        alert('Unable to open email client or copy to clipboard. Please try again.');
                    });
                } else {
                    alert('Unable to open email client. Please copy the document content manually and paste it into your email.');
                }
            }
        });
    }

    // Helper method to open email client
    openEmailClient(mailtoLink) {
        const mailtoElement = document.createElement('a');
        mailtoElement.href = mailtoLink;
        mailtoElement.style.display = 'none';
        document.body.appendChild(mailtoElement);

        // Click the element to trigger mailto
        mailtoElement.click();

        // Clean up after a short delay
        setTimeout(() => {
            if (document.body.contains(mailtoElement)) {
                document.body.removeChild(mailtoElement);
            }
        }, 100);
    }

    //Format date for the user's region
    formatDateForRegion(dateStr) {
        if (!dateStr) return '';

        try {
            // Detect user's locale from browser
            const userLocale = navigator.language || 'en-US';
            //console.log(`Using locale: ${userLocale} for date formatting`);

            // Handle different date formats
            let dateObj;
            if (typeof dateStr === 'string' && dateStr.includes('-')) {
                // Parse YYYY-MM-DD format
                const [year, month, day] = dateStr.split('-').map(Number);
                dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS
            } else {
                // Try standard date parsing
                dateObj = new Date(dateStr);
            }

            // Verify date is valid before formatting
            if (!isNaN(dateObj.getTime())) {
                // FIXED: Return properly formatted date using user's locale
                return dateObj.toLocaleDateString(userLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                console.warn('Invalid date provided to formatDateForRegion:', dateStr);
                return dateStr; // Return original on invalid date
            }
        } catch (e) {
            console.error('Error formatting date:', e);
            return dateStr; // Return original on error
        }
    }

    // Clear all document fields based on template type
    async clearDocumentFields(templateType) {
        // Set default current date and time
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        // Clear all fields based on template type
        switch (templateType) {
            case 'business-letter':
                document.getElementById('location-info').value = '';
                document.getElementById('letter-date').value = currentDate;
                document.getElementById('recipient-info').value = '';
                document.getElementById('letter-subject').value = '';
                document.getElementById('letter-greeting').value = Lang.get('documentGeneratorGreetingDefault1');
                document.getElementById('letter-body').value = '';
                document.getElementById('letter-tone').value = 'professional';
                document.getElementById('letter-closing').value = Lang.get('documentGeneratorClosingDefault1');
                document.getElementById('letter-signature').value = '';
                break;

            case 'contract':
                document.getElementById('contract-type').value = 'service';
                document.getElementById('contract-title').value = '';
                document.getElementById('party1-info').value = '';
                document.getElementById('party2-info').value = '';
                document.getElementById('contract-date').value = currentDate;
                document.getElementById('contract-term').value = '';
                document.getElementById('contract-scope').value = '';
                document.getElementById('contract-payment').value = '';
                document.getElementById('contract-confidentiality').value = '';
                document.getElementById('contract-ip').value = '';
                document.getElementById('contract-termination').value = '';
                document.getElementById('contract-disputes').value = '';
                document.getElementById('contract-terms').value = '';
                break;

            case 'proposal':
                document.getElementById('company-info').value = '';
                document.getElementById('client-info').value = '';
                document.getElementById('proposal-title').value = '';
                document.getElementById('proposal-type').value = 'services';
                document.getElementById('proposal-summary').value = '';
                document.getElementById('problem-statement').value = '';
                document.getElementById('proposed-solution').value = '';
                document.getElementById('deliverables').value = '';
                document.getElementById('timeline').value = '';
                document.getElementById('pricing').value = '';
                document.getElementById('team-qualifications').value = '';
                document.getElementById('case-studies').value = '';
                document.getElementById('call-to-action').value = '';
                document.getElementById('terms-conditions').value = '';
                document.getElementById('proposal-style').value = 'professional';
                break;

            case 'memo':
                document.getElementById('memo-company-info').value = '';
                document.getElementById('memo-date').value = currentDate;
                document.getElementById('memo-to').value = '';
                document.getElementById('memo-from').value = '';
                document.getElementById('memo-subject').value = '';
                document.getElementById('memo-body').value = '';
                document.getElementById('memo-tone').value = 'professional';
                document.getElementById('memo-attachments').value = '';
                break;

            case 'meeting-minutes':
                document.getElementById('minutes-org-name').value = '';
                document.getElementById('minutes-title').value = Lang.get('documentGeneratorMinutesTitlePlaceholder');
                document.getElementById('minutes-date').value = currentDate;
                document.getElementById('minutes-time').value = currentTime;
                document.getElementById('minutes-location').value = '';
                document.getElementById('minutes-facilitator').value = '';
                document.getElementById('minutes-attendees').value = '';
                document.getElementById('minutes-absent').value = '';
                document.getElementById('minutes-agenda').value = '';
                document.getElementById('minutes-discussion').value = '';
                document.getElementById('minutes-decisions').value = '';
                document.getElementById('minutes-actions').value = '';
                document.getElementById('minutes-next-date').value = '';
                document.getElementById('minutes-next-time').value = '';
                document.getElementById('minutes-notes').value = '';
                document.getElementById('minutes-preparer').value = '';
                document.getElementById('minutes-style').value = 'formal';
                break;
        }

        // Save the cleared state to the database
        await this.saveLetterData(templateType);

        // Show success feedback
        const feedbackEl = document.createElement('div');
        feedbackEl.textContent = Lang.get('documentGeneratorFormCleared');
        feedbackEl.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 10px 20px; border-radius: 4px; z-index: 10000; opacity: 0.9;';
        document.body.appendChild(feedbackEl);

        // Remove feedback after 2 seconds
        setTimeout(() => {
            feedbackEl.style.opacity = '0';
            feedbackEl.style.transition = 'opacity 0.5s';
            setTimeout(() => feedbackEl.remove(), 500);
        }, 2000);
    }

    //------------- Delegation for documents generation

    // Shows the loading state with a message (delegated to Paperwork instance)
    showLoadingState(message) {
        // Delegate to Paperwork instance
        return this.paperwork.showLoadingState(message);
    }

    // Clears the loading state (delegated to Paperwork instance)
    clearLoadingState() {
        // Delegate to Paperwork instance
        return this.paperwork.clearLoadingState();
    }

    // Shows a floating window/modal (delegated to Paperwork instance)
    showFloatingWindow(title, content, buttons = []) {
        // Delegate to Paperwork instance
        return this.paperwork.showFloatingWindow(title, content, buttons);
    }

    // Closes the floating window/modal (delegated to Paperwork instance)
    closeFloatingWindow() {
        // Delegate to Paperwork instance
        return this.paperwork.closeFloatingWindow();
    }

    // Calls the AI service for content generation/enhancement (delegated)
    callAIService(systemPrompt, userPrompt) {
        // Delegate to Paperwork instance
        return this.paperwork.callAIService(systemPrompt, userPrompt);
    }

    // Shows the document editor UI for a given template type (delegated)
    showDocumentEditor(templateType) {
        // Delegate to Paperwork instance
        return this.paperwork.uiHelpers.showDocumentEditor(templateType);
    }
}
window.DocumentGenerator = DocumentGenerator;


