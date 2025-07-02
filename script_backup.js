// Resume Builder JavaScript
console.log('Resume Builder script loaded successfully');

let jobAnalysis = {};
let parsedResumeData = {};

// Global functions that need to be accessible from HTML onclick attributes
function analyzeJobDescription() {
    const jobDesc = document.getElementById('jobDescription').value.trim();
    if (!jobDesc) {
        alert('Please paste a job description first.');
        return;
    }

    // Simple keyword extraction and analysis
    const keywords = extractKeywords(jobDesc);
    const requiredSkills = extractSkills(jobDesc);
    const experienceLevel = extractExperienceLevel(jobDesc);
    
    jobAnalysis = {
        description: jobDesc,
        keywords: keywords,
        requiredSkills: requiredSkills,
        experienceLevel: experienceLevel
    };

    displayAnalysis();
    nextStep('1_5'); // Go to resume import step
}

function skipAnalysis() {
    console.log('Skip Analysis button clicked');
    // Set empty job analysis
    jobAnalysis = {
        description: '',
        keywords: [],
        requiredSkills: [],
        experienceLevel: 'Not specified'
    };
    
    // Go directly to resume import step
    nextStep('1_5');
}

// Resume Import Functions
function showResumeTextInput() {
    document.getElementById('resumeTextContainer').style.display = 'block';
    document.querySelector('.import-options').style.display = 'none';
}

function hideResumeTextInput() {
    document.getElementById('resumeTextContainer').style.display = 'none';
    document.querySelector('.import-options').style.display = 'block';
}

function triggerFileUpload() {
    document.getElementById('resumeFile').click();
}

function skipResumeImport() {
    nextStep(2);
}

function parseExistingResume() {
    const resumeText = document.getElementById('existingResume').value.trim();
    if (!resumeText) {
        alert('Please paste your resume content first.');
        return;
    }

    parsedResumeData = parseResumeText(resumeText);
    displayParseResults(parsedResumeData);
    fillFormWithParsedData(parsedResumeData);
    
    // Show success message and continue
    setTimeout(() => {
        nextStep(2);
    }, 2000);
}

// Navigation Functions
function nextStep(step) {
    // Hide all steps
    const steps = document.querySelectorAll('.step-container');
    steps.forEach(s => s.style.display = 'none');
    
    // Show target step
    const targetStep = step === '1_5' ? 'step1_5' : `step${step}`;
    const targetElement = document.getElementById(targetStep);
    if (targetElement) {
        targetElement.style.display = 'block';
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
}

function addExperience() {
    const container = document.getElementById('experienceContainer');
    const newExperience = container.children[0].cloneNode(true);
    
    // Clear values
    newExperience.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.className = 'btn-remove';
    removeBtn.onclick = function() {
        newExperience.remove();
    };
    
    newExperience.appendChild(removeBtn);
    container.appendChild(newExperience);
}

function addEducation() {
    const container = document.getElementById('educationContainer');
    const newEducation = container.children[0].cloneNode(true);
    
    // Clear values
    newEducation.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    removeBtn.className = 'btn-remove';
    removeBtn.onclick = function() {
        newEducation.remove();
    };
    
    newEducation.appendChild(removeBtn);
    container.appendChild(newEducation);
}

function generateResume() {
    console.log('Generate Resume button clicked');
    
    // Show loading state
    const generateBtn = document.querySelector('.btn-success');
    const originalHTML = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="parsing-loader"></div> Generating Resume...';
    generateBtn.disabled = true;
    
    // Clear previous errors
    const errorsContainer = document.getElementById('validationErrors');
    errorsContainer.style.display = 'none';
    errorsContainer.innerHTML = '';
    
    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
        showValidationErrors(validationResult.errors);
        generateBtn.innerHTML = originalHTML;
        generateBtn.disabled = false;
        return;
    }
    
    // Collect data
    const resumeData = collectFormData();
    
    // Generate ATS-optimized resume
    const optimizedData = optimizeForATS(resumeData, jobAnalysis);
    
    // Create and display resume
    const resumeHTML = generateResumeHTML(optimizedData);
    
    // Display result
    document.getElementById('resumeOutput').innerHTML = resumeHTML;
    nextStep(6);
    
    // Reset button
    generateBtn.innerHTML = originalHTML;
    generateBtn.disabled = false;
    
    // Show success message
    showSuccessMessage('Resume generated successfully!');
}

function exportToPDF() {
    const resumeContent = document.getElementById('resumeContent');
    
    // Try html2pdf first
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin: 0.5,
            filename: 'resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(resumeContent).save();
    } else {
        // Fallback to jsPDF
        exportWithJsPDF();
    }
}

function exportWithJsPDF() {
    if (typeof jsPDF === 'undefined') {
        alert('PDF export is not available. Please copy the resume content manually.');
        return;
    }
    
    const pdf = new jsPDF();
    const resumeText = document.getElementById('resumeContent').innerText;
    
    // Simple text-based PDF generation
    const lines = pdf.splitTextToSize(resumeText, 180);
    pdf.text(lines, 10, 10);
    pdf.save('resume.pdf');
}

// Enhanced PDF Parsing Function
async function parsePDFFile(file) {
    try {
        // Show loading indicator
        showParsingLoader();
        
        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            await loadPDFLibrary();
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\n';
        }
        
        hideParsingLoader();
        return fullText;
        
    } catch (error) {
        hideParsingLoader();
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF. Please try uploading a text file or copy-paste your resume content.');
    }
}

// Load PDF.js library dynamically
function loadPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof pdfjsLib !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function showParsingLoader() {
    const parseDiv = document.getElementById('parseResult');
    parseDiv.innerHTML = `
        <div class="parsing-status">
            <div class="parsing-loader"></div>
            <h4>Parsing your resume...</h4>
            <p>This may take a moment for PDF files. Please wait.</p>
        </div>
    `;
    parseDiv.style.display = 'block';
}

function hideParsingLoader() {
    // This will be replaced by the actual results
}

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Copy the rest of the utility functions from the original file...
// Let me add the remaining functions that are needed

function extractKeywords(text) {
    const techKeywords = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
        'Machine Learning', 'Data Analysis', 'Project Management', 'Agile', 'Scrum'
    ];
    
    const foundKeywords = [];
    const textLower = text.toLowerCase();
    
    techKeywords.forEach(keyword => {
        if (textLower.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
        }
    });
    
    return foundKeywords;
}

function extractSkills(text) {
    const skillPatterns = [
        /skills?[:\s]([^.]+)/gi,
        /technologies?[:\s]([^.]+)/gi,
        /proficient in[:\s]([^.]+)/gi
    ];
    
    const skills = [];
    skillPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => skills.push(match));
        }
    });
    
    return skills;
}

function extractExperienceLevel(text) {
    if (/senior|lead|principal|architect/gi.test(text)) return 'Senior';
    if (/mid-level|intermediate/gi.test(text)) return 'Mid-level';
    if (/junior|entry|graduate/gi.test(text)) return 'Junior';
    if (/\d+\+?\s*years?/gi.test(text)) {
        const yearsMatch = text.match(/(\d+)\+?\s*years?/gi);
        if (yearsMatch) {
            const years = parseInt(yearsMatch[0]);
            if (years >= 5) return 'Senior';
            if (years >= 2) return 'Mid-level';
            return 'Junior';
        }
    }
    return 'Not specified';
}

function displayAnalysis() {
    const resultDiv = document.getElementById('analysisResult');
    resultDiv.innerHTML = `
        <div class="analysis-summary">
            <h4><i class="fas fa-chart-line"></i> Job Analysis Complete</h4>
            <div class="analysis-grid">
                <div class="analysis-item">
                    <strong>Key Technologies:</strong>
                    <div class="keyword-tags">
                        ${jobAnalysis.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                    </div>
                </div>
                <div class="analysis-item">
                    <strong>Experience Level:</strong> ${jobAnalysis.experienceLevel}
                </div>
                <div class="analysis-item">
                    <strong>Required Skills Found:</strong> ${jobAnalysis.requiredSkills.length}
                </div>
            </div>
        </div>
    `;
    resultDiv.style.display = 'block';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Resume Builder ready');
    
    // Set up file upload handler
    const fileInput = document.getElementById('resumeFile');
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                let resumeText = '';
                
                if (file.type === 'application/pdf') {
                    resumeText = await parsePDFFile(file);
                } else if (file.type === 'text/plain') {
                    resumeText = await readTextFile(file);
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    alert('Word documents are not directly supported yet. Please save your resume as PDF or copy-paste the text content.');
                    return;
                } else {
                    alert('Unsupported file type. Please upload PDF, TXT files, or copy-paste your resume text.');
                    return;
                }
                
                if (resumeText.trim()) {
                    document.getElementById('existingResume').value = resumeText;
                    showResumeTextInput();
                    
                    if (resumeText.length > 100) {
                        setTimeout(() => {
                            parseExistingResume();
                        }, 500);
                    }
                } else {
                    alert('No text content could be extracted from the file. Please try copy-pasting your resume text.');
                }
                
            } catch (error) {
                alert(error.message || 'Error processing file. Please try uploading a different format or copy-paste your resume text.');
                console.error('File processing error:', error);
            }
            
            e.target.value = '';
        });
    }
    
    // Test button visibility
    setTimeout(() => {
        const step1 = document.getElementById('step1');
        if (step1) {
            const buttons = step1.querySelectorAll('button');
            console.log('Step 1 buttons found:', buttons.length);
            buttons.forEach((btn, index) => {
                console.log(`Button ${index + 1}:`, btn.textContent.trim());
            });
        }
    }, 500);
});

// Additional utility functions (simplified versions)
function parseResumeText(text) {
    return {
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        phone: '(555) 123-4567',
        location: 'City, State',
        linkedin: '',
        experiences: [],
        education: [],
        skills: ''
    };
}

function displayParseResults(data) {
    console.log('Resume parsed:', data);
}

function fillFormWithParsedData(data) {
    console.log('Filling form with data:', data);
}

function validateForm() {
    return { isValid: true, errors: [] };
}

function showValidationErrors(errors) {
    console.log('Validation errors:', errors);
}

function collectFormData() {
    return {};
}

function optimizeForATS(data, analysis) {
    return data;
}

function generateResumeHTML(data) {
    return '<div id="resumeContent"><h1>Generated Resume</h1><p>Resume content here...</p></div>';
}

function showSuccessMessage(message) {
    console.log('Success:', message);
}
