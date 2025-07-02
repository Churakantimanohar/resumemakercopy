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

    console.log('Starting resume parsing...');
    console.log('Resume text length:', resumeText.length);
    
    try {
        parsedResumeData = parseResumeText(resumeText);
        console.log('Parsing completed. Result:', parsedResumeData);
        
        displayParseResults(parsedResumeData);
        fillFormWithParsedData(parsedResumeData);
        
        // Show success message and continue after a delay
        setTimeout(() => {
            console.log('Navigating to next step...');
            nextStep(2);
        }, 3000); // Increased delay to see results
        
    } catch (error) {
        console.error('Error during resume parsing:', error);
        alert('Error parsing resume: ' + error.message);
    }
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
    if (!generateBtn) {
        console.error('Generate button not found');
        return;
    }
    
    const originalHTML = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="parsing-loader"></div> Generating Resume...';
    generateBtn.disabled = true;
    
    // Clear previous errors (only if the container exists)
    const errorsContainer = document.getElementById('validationErrors');
    if (errorsContainer) {
        errorsContainer.style.display = 'none';
        errorsContainer.innerHTML = '';
    }
    
    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
        showValidationErrors(validationResult.errors);
        generateBtn.innerHTML = originalHTML;
        generateBtn.disabled = false;
        return;
    }
    
    try {
        // Collect data
        const resumeData = collectFormData();
        console.log('Collected form data:', resumeData);
        
        // Generate ATS-optimized resume
        const optimizedData = optimizeForATS(resumeData, jobAnalysis);
        console.log('Optimized data:', optimizedData);
        
        // Create and display resume
        const resumeHTML = generateResumeHTML(optimizedData);
        console.log('Generated resume HTML');
        
        // Display result
        document.getElementById('resumeOutput').innerHTML = `
            <div class="resume-actions">
                <button onclick="downloadResume()" class="btn-primary"><i class="fas fa-download"></i> Download PDF</button>
                <button onclick="copyToClipboard()" class="btn-secondary"><i class="fas fa-copy"></i> Copy Text</button>
                <button onclick="startOver()" class="btn-secondary"><i class="fas fa-redo"></i> Create Another</button>
            </div>
            ${resumeHTML}
        `;
        
        // Hide all steps and show resume output
        document.querySelectorAll('.step-container').forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById('resumeOutput').style.display = 'block';
        
        // Reset button
        generateBtn.innerHTML = originalHTML;
        generateBtn.disabled = false;
        
        // Show success message
        showSuccessMessage('Resume generated successfully!');
        
        // Scroll to resume
        document.getElementById('resumeOutput').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error generating resume:', error);
        alert('Error generating resume: ' + error.message);
        
        // Reset button on error
        generateBtn.innerHTML = originalHTML;
        generateBtn.disabled = false;
    }
}

function exportToPDF() {
    console.log('Exporting to PDF...');
    const resumeContent = document.getElementById('resumeContent');
    
    if (!resumeContent) {
        alert('No resume content found. Please generate a resume first.');
        return;
    }
    
    // Add PDF-ready class for better styling
    resumeContent.classList.add('pdf-ready');
    
    // Try html2pdf first
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin: [0.4, 0.4, 0.4, 0.4],
            filename: `${document.querySelector('.name')?.textContent?.replace(/\s+/g, '_') || 'resume'}.pdf`,
            image: { 
                type: 'jpeg', 
                quality: 0.98 
            },
            html2canvas: { 
                scale: 1.5,
                useCORS: true,
                letterRendering: true,
                logging: false,
                height: resumeContent.scrollHeight,
                width: resumeContent.scrollWidth
            },
            jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.resume-section',
                after: '.experience-entry'
            }
        };
        
        html2pdf()
            .set(opt)
            .from(resumeContent)
            .save()
            .then(() => {
                console.log('PDF generated successfully');
                resumeContent.classList.remove('pdf-ready');
            })
            .catch((error) => {
                console.error('html2pdf failed:', error);
                resumeContent.classList.remove('pdf-ready');
                exportWithJsPDF();
            });
    } else {
        console.log('html2pdf not available, using jsPDF fallback');
        exportWithJsPDF();
    }
}

function exportWithJsPDF() {
    console.log('Using jsPDF fallback...');
    
    // Check if jsPDF is available in various ways
    let jsPDFLib = null;
    if (typeof window.jsPDF !== 'undefined') {
        jsPDFLib = window.jsPDF.jsPDF || window.jsPDF;
    } else if (typeof jsPDF !== 'undefined') {
        jsPDFLib = jsPDF;
    } else if (typeof window.jspdf !== 'undefined') {
        jsPDFLib = window.jspdf.jsPDF;
    }
    
    if (!jsPDFLib) {
        alert('PDF export libraries are not loaded. Please try refreshing the page and try again.');
        return;
    }
    
    try {
        const pdf = new jsPDFLib('p', 'mm', 'a4');
        
        const resumeElement = document.getElementById('resumeContent');
        if (!resumeElement) {
            alert('No resume content found.');
            return;
        }
        
        // Get the text content and format it nicely
        const resumeText = formatResumeForPDF(resumeElement);
        
        // Set font and add text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        const lines = pdf.splitTextToSize(resumeText, 180);
        let yPosition = 20;
        const lineHeight = 5;
        const pageHeight = 280;
        
        lines.forEach((line) => {
            if (yPosition > pageHeight) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text(line, 15, yPosition);
            yPosition += lineHeight;
        });
        
        pdf.save('resume.pdf');
        console.log('PDF generated with jsPDF successfully');
        
    } catch (error) {
        console.error('jsPDF failed:', error);
        alert('PDF export failed. Please copy the resume content manually.');
    }
}

function formatResumeForPDF(element) {
    // Create a cleaner text version for PDF
    let text = '';
    
    // Get name
    const nameEl = element.querySelector('.name');
    if (nameEl) {
        text += nameEl.textContent.toUpperCase() + '\n';
        text += '=' + '='.repeat(nameEl.textContent.length) + '\n\n';
    }
    
    // Get contact info
    const contactEl = element.querySelector('.contact-info');
    if (contactEl) {
        text += contactEl.textContent.replace(/•/g, ' | ') + '\n\n';
    }
    
    // Get sections
    const sections = element.querySelectorAll('.resume-section');
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        if (title) {
            text += title.textContent.toUpperCase() + '\n';
            text += '-'.repeat(title.textContent.length) + '\n';
        }
        
        // Get section content
        const content = section.cloneNode(true);
        const titleEl = content.querySelector('.section-title');
        if (titleEl) titleEl.remove();
        
        text += content.textContent.trim() + '\n\n';
    });
    
    return text;
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
    
    // Debug: Check if buttons are present
    setTimeout(() => {
        const step1 = document.getElementById('step1');
        if (step1) {
            console.log('Step 1 container found');
            const buttonGroup = step1.querySelector('.button-group');
            if (buttonGroup) {
                console.log('Button group found');
                const buttons = buttonGroup.querySelectorAll('button');
                console.log('Step 1 buttons found:', buttons.length);
                buttons.forEach((btn, index) => {
                    console.log(`Button ${index + 1}:`, btn.textContent.trim());
                    console.log(`Button ${index + 1} onclick:`, btn.getAttribute('onclick'));
                    console.log(`Button ${index + 1} styles:`, window.getComputedStyle(btn).display);
                });
            } else {
                console.log('Button group NOT found');
            }
        } else {
            console.log('Step 1 container NOT found');
        }
        
        // Test if functions are accessible
        console.log('analyzeJobDescription function:', typeof window.analyzeJobDescription);
        console.log('skipAnalysis function:', typeof window.skipAnalysis);
    }, 1000);
    
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
                    alert('No text content could be extracted from the file. Please try uploading a different format or copy-paste your resume text.');
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
    console.log('Parsing resume text length:', text.length);
    console.log('First 200 characters:', text.substring(0, 200));
    
    const data = {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        professionalLinks: [],
        experiences: [],
        education: {},
        skills: ''
    };
    
    // Clean the text - remove extra whitespace and normalize
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Total lines:', lines.length);
    console.log('First 5 lines:', lines.slice(0, 5));
    
    // Extract email - more comprehensive patterns
    const emailPatterns = [
        /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    ];
    
    for (const pattern of emailPatterns) {
        const emailMatches = text.match(pattern);
        if (emailMatches && emailMatches.length > 0) {
            data.email = emailMatches[0];
            console.log('Found email:', data.email);
            break;
        }
    }
    
    // Extract phone number - comprehensive patterns
    const phonePatterns = [
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        /(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
        /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
    ];
    
    for (const pattern of phonePatterns) {
        const phoneMatches = text.match(pattern);
        if (phoneMatches && phoneMatches.length > 0) {
            data.phone = phoneMatches[0];
            console.log('Found phone:', data.phone);
            break;
        }
    }
    
    // Extract professional links - comprehensive
    data.professionalLinks = [];
    
    // LinkedIn patterns
    const linkedinPatterns = [
        /linkedin\.com\/in\/[\w-]+/gi,
        /linkedin\.com\/pub\/[\w-]+/gi,
        /www\.linkedin\.com\/in\/[\w-]+/gi
    ];
    
    for (const pattern of linkedinPatterns) {
        const linkedinMatch = text.match(pattern);
        if (linkedinMatch && linkedinMatch.length > 0) {
            const url = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0];
            data.professionalLinks.push({
                type: 'LinkedIn',
                url: url,
                display: 'LinkedIn'
            });
            console.log('Found LinkedIn:', url);
            break;
        }
    }
    
    // GitHub patterns
    const githubPatterns = [
        /github\.com\/[\w-]+/gi,
        /www\.github\.com\/[\w-]+/gi
    ];
    
    for (const pattern of githubPatterns) {
        const githubMatch = text.match(pattern);
        if (githubMatch && githubMatch.length > 0) {
            const url = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];
            data.professionalLinks.push({
                type: 'GitHub',
                url: url,
                display: 'GitHub'
            });
            console.log('Found GitHub:', url);
            break;
        }
    }
    
    // LeetCode patterns
    const leetcodePatterns = [
        /leetcode\.com\/[\w-]+/gi,
        /www\.leetcode\.com\/[\w-]+/gi
    ];
    
    for (const pattern of leetcodePatterns) {
        const leetcodeMatch = text.match(pattern);
        if (leetcodeMatch && leetcodeMatch.length > 0) {
            const url = leetcodeMatch[0].startsWith('http') ? leetcodeMatch[0] : 'https://' + leetcodeMatch[0];
            data.professionalLinks.push({
                type: 'LeetCode',
                url: url,
                display: 'LeetCode'
            });
            console.log('Found LeetCode:', url);
            break;
        }
    }
    
    // HackerRank patterns
    const hackerrankPatterns = [
        /hackerrank\.com\/[\w-]+/gi,
        /www\.hackerrank\.com\/[\w-]+/gi
    ];
    
    for (const pattern of hackerrankPatterns) {
        const hackerrankMatch = text.match(pattern);
        if (hackerrankMatch && hackerrankMatch.length > 0) {
            const url = hackerrankMatch[0].startsWith('http') ? hackerrankMatch[0] : 'https://' + hackerrankMatch[0];
            data.professionalLinks.push({
                type: 'HackerRank',
                url: url,
                display: 'HackerRank'
            });
            console.log('Found HackerRank:', url);
            break;
        }
    }
    
    // CodePen patterns
    const codepenPatterns = [
        /codepen\.io\/[\w-]+/gi,
        /www\.codepen\.io\/[\w-]+/gi
    ];
    
    for (const pattern of codepenPatterns) {
        const codepenMatch = text.match(pattern);
        if (codepenMatch && codepenMatch.length > 0) {
            const url = codepenMatch[0].startsWith('http') ? codepenMatch[0] : 'https://' + codepenMatch[0];
            data.professionalLinks.push({
                type: 'CodePen',
                url: url,
                display: 'CodePen'
            });
            console.log('Found CodePen:', url);
            break;
        }
    }
    
    // Behance patterns
    const behancePatterns = [
        /behance\.net\/[\w-]+/gi,
        /www\.behance\.net\/[\w-]+/gi
    ];
    
    for (const pattern of behancePatterns) {
        const behanceMatch = text.match(pattern);
        if (behanceMatch && behanceMatch.length > 0) {
            const url = behanceMatch[0].startsWith('http') ? behanceMatch[0] : 'https://' + behanceMatch[0];
            data.professionalLinks.push({
                type: 'Behance',
                url: url,
                display: 'Behance'
            });
            console.log('Found Behance:', url);
            break;
        }
    }
    
    // Dribbble patterns
    const dribbblePatterns = [
        /dribbble\.com\/[\w-]+/gi,
        /www\.dribbble\.com\/[\w-]+/gi
    ];
    
    for (const pattern of dribbblePatterns) {
        const dribbbleMatch = text.match(pattern);
        if (dribbbleMatch && dribbbleMatch.length > 0) {
            const url = dribbbleMatch[0].startsWith('http') ? dribbbleMatch[0] : 'https://' + dribbbleMatch[0];
            data.professionalLinks.push({
                type: 'Dribbble',
                url: url,
                display: 'Dribbble'
            });
            console.log('Found Dribbble:', url);
            break;
        }
    }
    
    // Stack Overflow patterns
    const stackoverflowPatterns = [
        /stackoverflow\.com\/users\/[\w-]+/gi,
        /www\.stackoverflow\.com\/users\/[\w-]+/gi
    ];
    
    for (const pattern of stackoverflowPatterns) {
        const stackoverflowMatch = text.match(pattern);
        if (stackoverflowMatch && stackoverflowMatch.length > 0) {
            const url = stackoverflowMatch[0].startsWith('http') ? stackoverflowMatch[0] : 'https://' + stackoverflowMatch[0];
            data.professionalLinks.push({
                type: 'Stack Overflow',
                url: url,
                display: 'Stack Overflow'
            });
            console.log('Found Stack Overflow:', url);
            break;
        }
    }
    
    // Portfolio/personal website patterns (only if we haven't reached the limit)
    if (data.professionalLinks.length < 3) {
        const portfolioPatterns = [
            /(?:portfolio|website|personal site):\s*(https?:\/\/[\w.-]+)/gi,
            /(https?:\/\/[\w.-]+\.(?:com|net|org|io|dev))/gi
        ];
        
        for (const pattern of portfolioPatterns) {
            const portfolioMatches = text.match(pattern);
            if (portfolioMatches && portfolioMatches.length > 0) {
                // Filter out platforms we already handle
                const filteredMatches = portfolioMatches.filter(match => 
                    !match.toLowerCase().includes('linkedin') &&
                    !match.toLowerCase().includes('github') &&
                    !match.toLowerCase().includes('leetcode') &&
                    !match.toLowerCase().includes('hackerrank') &&
                    !match.toLowerCase().includes('codepen') &&
                    !match.toLowerCase().includes('behance') &&
                    !match.toLowerCase().includes('dribbble') &&
                    !match.toLowerCase().includes('stackoverflow')
                );
                
                if (filteredMatches.length > 0 && data.professionalLinks.length < 3) {
                    const url = filteredMatches[0];
                    data.professionalLinks.push({
                        type: 'Portfolio',
                        url: url,
                        display: 'Portfolio'
                    });
                    console.log('Found Portfolio:', url);
                    break;
                }
            }
        }
    }
    
    // Extract name - try multiple approaches
    const namePatterns = [
        // Name at the very beginning
        /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
        // Name after whitespace at beginning
        /^\s*([A-Z][A-Z\s]+[A-Z])\s*$/m,
        // Name: label
        /(?:Name|Full Name):\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i,
        // First line that looks like a name
        /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)(?:\s|$)/m
    ];
    
    // Also try the first line if it looks like a name
    if (lines.length > 0) {
        const firstLine = lines[0];
        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(firstLine) && firstLine.length < 50 && !firstLine.includes('@')) {
            data.fullName = firstLine.trim();
            console.log('Found name from first line:', data.fullName);
        }
    }
    
    // If no name found from first line, try patterns
    if (!data.fullName) {
        for (const pattern of namePatterns) {
            const nameMatch = text.match(pattern);
            if (nameMatch && nameMatch[1] && nameMatch[1].length < 50 && !nameMatch[1].includes('@')) {
                data.fullName = nameMatch[1].trim();
                console.log('Found name from pattern:', data.fullName);
                break;
            }
        }
    }
    
    // Extract location - improved patterns
    const locationPatterns = [
        /([A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/g,
        /([A-Z][a-z]+,\s*[A-Z][a-z]+)/g,
        /(?:Location|Address|City):\s*([A-Z][a-z]+,\s*[A-Z]{2,})/gi,
        /([A-Z][a-z]+\s*,\s*[A-Z][a-z]+\s*,?\s*(?:USA?|United States)?)/gi
    ];
    
    for (const pattern of locationPatterns) {
        const locationMatches = text.match(pattern);
        if (locationMatches && locationMatches.length > 0) {
            data.location = locationMatches[0].replace(/^(Location|Address|City):\s*/i, '').trim();
            console.log('Found location:', data.location);
            break;
        }
    }
    
    // Extract skills - more comprehensive
    const skillsPatterns = [
        /(?:Technical\s+)?Skills?:\s*([^.\n]+(?:\n[^:\n]+)*)/gi,
        /(?:Technologies|Tech\s+Stack):\s*([^.\n]+(?:\n[^:\n]+)*)/gi,
        /(?:Programming\s+Languages?):\s*([^.\n]+)/gi,
        /(?:Proficient\s+in):\s*([^.\n]+)/gi,
        /(?:Experience\s+with):\s*([^.\n]+)/gi
    ];
    
    for (const pattern of skillsPatterns) {
        const skillsMatches = text.match(pattern);
        if (skillsMatches && skillsMatches.length > 0) {
            let skillsText = skillsMatches[0].replace(/^[^:]*:\s*/i, '').trim();
            // Clean up common formatting
            skillsText = skillsText.replace(/[•\-\*]/g, ',').replace(/\s+/g, ' ');
            data.skills = skillsText;
            console.log('Found skills:', data.skills);
            break;
        }
    }
    
    // Extract education - improved
    const educationPatterns = [
        /((?:Bachelor|Master|PhD|Associate|B\.?[AS]\.?|M\.?[AS]\.?)[^.\n]+)/gi,
        /(?:Education|Academic Background):\s*([^.\n]+)/gi,
        /(University|College|Institute)[^.\n]+/gi
    ];
    
    let degreeFound = false;
    for (const pattern of educationPatterns) {
        const eduMatches = text.match(pattern);
        if (eduMatches && eduMatches.length > 0) {
            if (!degreeFound && /(?:Bachelor|Master|PhD|Associate|B\.?[AS]\.?|M\.?[AS]\.?)/i.test(eduMatches[0])) {
                data.education.degree = eduMatches[0].trim();
                degreeFound = true;
                console.log('Found degree:', data.education.degree);
            } else if (!data.education.university && /(?:University|College|Institute)/i.test(eduMatches[0])) {
                data.education.university = eduMatches[0].trim();
                console.log('Found university:', data.education.university);
            }
        }
    }
    
    // Extract graduation year
    const yearMatches = text.match(/(?:Graduated?|Graduation).*?(20\d{2})|20\d{2}/gi);
    if (yearMatches) {
        const years = yearMatches.map(match => {
            const yearMatch = match.match(/20\d{2}/);
            return yearMatch ? yearMatch[0] : null;
        }).filter(year => year);
        
        if (years.length > 0) {
            data.education.graduationYear = years[0];
            console.log('Found graduation year:', data.education.graduationYear);
        }
    }
    
    // Extract work experience - improved and more precise
    const experienceKeywords = ['experience', 'employment', 'work history', 'professional experience', 'career'];
    let experienceSection = '';
    
    for (const keyword of experienceKeywords) {
        const regex = new RegExp(`(?:${keyword})([\\s\\S]*?)(?:education|skills|projects|$)`, 'gi');
        const match = text.match(regex);
        if (match && match.length > 0) {
            experienceSection = match[0];
            console.log('Found experience section:', experienceSection.substring(0, 200));
            break;
        }
    }
    
    if (experienceSection) {
        // More precise job title and company patterns
        const jobPatterns = [
            // Pattern: Job Title at Company Name
            /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Director|Coordinator|Assistant|Intern|Lead))\s+(?:at|@)\s+([A-Z][a-zA-Z\s&.,]+)/gi,
            // Pattern: Job Title | Company Name or Job Title - Company Name
            /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Director|Coordinator|Assistant|Intern|Lead))\s*[\|\-]\s*([A-Z][a-zA-Z\s&.,]{3,40})/gi,
            // Pattern: Company Name (Job Title)
            /([A-Z][a-zA-Z\s&.,]{3,40})\s*\(([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Director|Coordinator|Assistant|Intern|Lead))\)/gi
        ];
        
        let foundExperience = false;
        for (const pattern of jobPatterns) {
            const jobMatches = [...experienceSection.matchAll(pattern)];
            jobMatches.forEach((match, index) => {
                if (index < 2) { // Limit to 2 experiences to avoid clutter
                    let title = '';
                    let company = '';
                    
                    // Handle different pattern match groups
                    if (pattern.source.includes('\\(')) {
                        // Company (Title) pattern
                        company = match[1] ? match[1].trim() : '';
                        title = match[2] ? match[2].trim() : '';
                    } else {
                        // Title at/| Company pattern
                        title = match[1] ? match[1].trim() : '';
                        company = match[2] ? match[2].trim() : '';
                    }
                    
                    // Validate that title and company make sense
                    if (title.length > 5 && title.length < 50 && 
                        company.length > 2 && company.length < 50 &&
                        !title.toLowerCase().includes('problem') &&
                        !title.toLowerCase().includes('debugging') &&
                        !company.toLowerCase().includes('abilities')) {
                        
                        data.experiences.push({
                            title: title,
                            company: company,
                            duration: 'Present',
                            location: '',
                            achievements: ''
                        });
                        console.log('Added valid experience:', { title, company });
                        foundExperience = true;
                    }
                }
            });
            if (foundExperience) break;
        }
        
        // If no structured experience found, try line-by-line approach
        if (!foundExperience) {
            const lines = experienceSection.split('\n').map(line => line.trim()).filter(line => line.length > 10);
            
            for (let i = 0; i < lines.length - 1 && data.experiences.length < 2; i++) {
                const line = lines[i];
                const nextLine = lines[i + 1];
                
                // Look for job title patterns in a line
                if (/(?:Engineer|Developer|Manager|Analyst|Specialist|Director|Coordinator|Assistant|Intern|Lead)/i.test(line) &&
                    line.length < 50 && !line.toLowerCase().includes('problem') && !line.toLowerCase().includes('debugging')) {
                    
                    // Check if next line might be a company
                    if (nextLine && nextLine.length < 50 && /^[A-Z]/.test(nextLine) &&
                        !nextLine.toLowerCase().includes('problem') && !nextLine.toLowerCase().includes('debugging')) {
                        
                        data.experiences.push({
                            title: line,
                            company: nextLine,
                            duration: 'Present',
                            location: '',
                            achievements: ''
                        });
                        console.log('Added experience from lines:', { title: line, company: nextLine });
                        i++; // Skip next line since we used it as company
                    }
                }
            }
        }
    } else {
        console.log('No experience section found in resume');
    }
    
    console.log('Final parsed data:', data);
    return data;
}

function displayParseResults(data) {
    const parseDiv = document.getElementById('parseResult');
    const hasData = data.fullName || data.email || data.phone || data.skills;
    
    if (hasData) {
        parseDiv.innerHTML = `
            <div class="parse-success">
                <h4><i class="fas fa-check-circle"></i> Resume Parsed Successfully!</h4>
                <div class="parsed-data-preview">
                    ${data.fullName ? `<p><strong>Name:</strong> ${data.fullName}</p>` : ''}
                    ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
                    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
                    ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
                    ${data.skills ? `<p><strong>Skills:</strong> ${data.skills.substring(0, 100)}...</p>` : ''}
                    ${data.experiences.length ? `<p><strong>Experience:</strong> ${data.experiences.length} positions found</p>` : ''}
                </div>
                <p class="success-message">Form fields will be auto-filled in the next step!</p>
            </div>
        `;
    } else {
        parseDiv.innerHTML = `
            <div class="parse-warning">
                <h4><i class="fas fa-exclamation-triangle"></i> Limited Data Extracted</h4>
                <p>We found some content but couldn't extract structured data. You'll need to fill in the form manually.</p>
            </div>
        `;
    }
    parseDiv.style.display = 'block';
}

function fillFormWithParsedData(data) {
    console.log('Filling form with parsed data:', data);
    
    // Fill personal information with better error handling
    try {
        if (data.fullName && data.fullName.trim()) {
            const nameField = document.getElementById('fullName');
            if (nameField) {
                nameField.value = data.fullName.trim();
                console.log('Filled name:', data.fullName);
            }
        }
        
        if (data.email && data.email.trim()) {
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.value = data.email.trim();
                console.log('Filled email:', data.email);
            }
        }
        
        if (data.phone && data.phone.trim()) {
            const phoneField = document.getElementById('phone');
            if (phoneField) {
                phoneField.value = data.phone.trim();
                console.log('Filled phone:', data.phone);
            }
        }
        
        if (data.location && data.location.trim()) {
            const locationField = document.getElementById('location');
            if (locationField) {
                locationField.value = data.location.trim();
                console.log('Filled location:', data.location);
            }
        }
        
        // Fill professional links
        if (data.professionalLinks && data.professionalLinks.length > 0) {
            for (let i = 0; i < Math.min(data.professionalLinks.length, 3); i++) {
                const link = data.professionalLinks[i];
                const typeField = document.getElementById(`linkType${i + 1}`);
                const urlField = document.getElementById(`linkUrl${i + 1}`);
                
                if (typeField && urlField) {
                    typeField.value = link.type;
                    urlField.value = link.url;
                    console.log(`Filled professional link ${i + 1}:`, link.type, link.url);
                }
            }
        }
        
        // Fill skills with better handling
        if (data.skills && data.skills.trim()) {
            const skillsField = document.getElementById('technicalSkills');
            if (skillsField) {
                skillsField.value = data.skills.trim();
                console.log('Filled skills:', data.skills);
            }
        }
        
        // Fill education with improved structure handling
        if (data.education && typeof data.education === 'object') {
            if (data.education.degree && data.education.degree.trim()) {
                const degreeField = document.getElementById('degree');
                if (degreeField) {
                    degreeField.value = data.education.degree.trim();
                    console.log('Filled degree:', data.education.degree);
                }
            }
            
            if (data.education.university && data.education.university.trim()) {
                const universityField = document.getElementById('university');
                if (universityField) {
                    universityField.value = data.education.university.trim();
                    console.log('Filled university:', data.education.university);
                }
            }
            
            if (data.education.graduationYear && data.education.graduationYear.trim()) {
                const gradYearField = document.getElementById('graduationYear');
                if (gradYearField) {
                    gradYearField.value = data.education.graduationYear.trim();
                    console.log('Filled graduation year:', data.education.graduationYear);
                }
            }
            
            if (data.education.gpa && data.education.gpa.trim()) {
                const gpaField = document.getElementById('gpa');
                if (gpaField) {
                    gpaField.value = data.education.gpa.trim();
                    console.log('Filled GPA:', data.education.gpa);
                }
            }
        }
        
        // Fill first experience if available with better validation
        if (data.experiences && Array.isArray(data.experiences) && data.experiences.length > 0) {
            const firstExp = data.experiences[0];
            const expContainer = document.getElementById('experienceContainer');
            
            // Validate experience data quality
            const isValidExperience = (exp) => {
                const hasValidTitle = exp.title && exp.title.trim().length > 3 && 
                                    !exp.title.toLowerCase().includes('problem') &&
                                    !exp.title.toLowerCase().includes('debugging') &&
                                    !exp.title.toLowerCase().includes('abilities');
                
                const hasValidCompany = exp.company && exp.company.trim().length > 2 &&
                                       !exp.company.toLowerCase().includes('problem') &&
                                       !exp.company.toLowerCase().includes('debugging') &&
                                       !exp.company.toLowerCase().includes('abilities');
                
                return hasValidTitle && hasValidCompany;
            };
            
            if (expContainer && firstExp && isValidExperience(firstExp)) {
                const firstExpElement = expContainer.querySelector('.experience-item');
                
                if (firstExpElement) {
                    const titleField = firstExpElement.querySelector('.exp-title');
                    if (titleField && firstExp.title) {
                        titleField.value = firstExp.title.trim();
                        console.log('Filled job title:', firstExp.title);
                    }
                    
                    const companyField = firstExpElement.querySelector('.exp-company');
                    if (companyField && firstExp.company) {
                        companyField.value = firstExp.company.trim();
                        console.log('Filled company:', firstExp.company);
                    }
                    
                    const durationField = firstExpElement.querySelector('.exp-duration');
                    if (durationField && firstExp.duration) {
                        durationField.value = firstExp.duration.trim();
                        console.log('Filled duration:', firstExp.duration);
                    }
                    
                    const expLocationField = firstExpElement.querySelector('.exp-location');
                    if (expLocationField && firstExp.location) {
                        expLocationField.value = firstExp.location.trim();
                        console.log('Filled exp location:', firstExp.location);
                    }
                    
                    const achievementsField = firstExpElement.querySelector('.exp-achievements');
                    if (achievementsField && firstExp.achievements) {
                        achievementsField.value = firstExp.achievements.trim();
                        console.log('Filled achievements:', firstExp.achievements);
                    }
                }
            } else {
                console.log('Experience data failed validation, skipping auto-fill for experience');
                if (firstExp) {
                    console.log('Invalid experience data:', firstExp);
                }
            }
        }
        
        // Store parsed data globally for potential later use
        window.parsedResumeData = data;
        
        console.log('Form filling completed successfully');
        
        // Provide user feedback
        const successCount = [
            data.fullName, data.email, data.phone, data.location, 
            data.skills, data.education?.degree, data.experiences?.length > 0
        ].filter(Boolean).length;
        
        if (successCount > 0) {
            console.log(`Successfully filled ${successCount} fields`);
        } else {
            console.log('No fields were filled - check parsing logic');
        }
        
    } catch (error) {
        console.error('Error filling form with parsed data:', error);
    }
}

function validateForm() {
    const errors = [];
    
    try {
        // Check required fields with null checks
        const fullNameEl = document.getElementById('fullName');
        const emailEl = document.getElementById('email');
        const phoneEl = document.getElementById('phone');
        
        const fullName = fullNameEl ? fullNameEl.value.trim() : '';
        const email = emailEl ? emailEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';
        
        if (!fullName) errors.push('Full name is required');
        if (!email) {
            errors.push('Email is required');
        } else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
            errors.push('Please enter a valid email address');
        }
        if (!phone) errors.push('Phone number is required');
        
        // Check if at least one experience is filled
        const firstExpTitleEl = document.querySelector('.exp-title');
        const firstExpCompanyEl = document.querySelector('.exp-company');
        
        const firstExpTitle = firstExpTitleEl ? firstExpTitleEl.value.trim() : '';
        const firstExpCompany = firstExpCompanyEl ? firstExpCompanyEl.value.trim() : '';
        
        if (!firstExpTitle && !firstExpCompany) {
            errors.push('Please add at least one work experience (job title or company)');
        }
        
        console.log('Validation completed. Errors found:', errors.length);
        
    } catch (error) {
        console.error('Error during form validation:', error);
        errors.push('Error validating form. Please check all fields are filled correctly.');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function showValidationErrors(errors) {
    let errorsContainer = document.getElementById('validationErrors');
    if (!errorsContainer) {
        errorsContainer = document.createElement('div');
        errorsContainer.id = 'validationErrors';
        errorsContainer.className = 'validation-errors';
        document.getElementById('step5').insertBefore(errorsContainer, document.querySelector('#step5 .button-group'));
    }
    
    errorsContainer.innerHTML = `
        <div class="error-box">
            <h4><i class="fas fa-exclamation-circle"></i> Please fix the following errors:</h4>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
    `;
    errorsContainer.style.display = 'block';
    errorsContainer.scrollIntoView({ behavior: 'smooth' });
}

function collectFormData() {
    console.log('Collecting form data...');
    
    const data = {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        professionalLinks: [],
        degree: '',
        university: '',
        graduationYear: '',
        gpa: '',
        technicalSkills: '',
        softSkills: '',
        experiences: []
    };
    
    // Safely collect form data with error handling
    try {
        const fullNameEl = document.getElementById('fullName');
        if (fullNameEl) data.fullName = fullNameEl.value.trim();
        
        const emailEl = document.getElementById('email');
        if (emailEl) data.email = emailEl.value.trim();
        
        const phoneEl = document.getElementById('phone');
        if (phoneEl) data.phone = phoneEl.value.trim();
        
        const locationEl = document.getElementById('location');
        if (locationEl) data.location = locationEl.value.trim();
        
        // Collect professional links
        for (let i = 1; i <= 3; i++) {
            const linkTypeEl = document.getElementById(`linkType${i}`);
            const linkUrlEl = document.getElementById(`linkUrl${i}`);
            
            if (linkTypeEl && linkUrlEl) {
                const linkType = linkTypeEl.value.trim();
                const linkUrl = linkUrlEl.value.trim();
                
                if (linkType && linkUrl) {
                    // Ensure URL has protocol
                    const formattedUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
                    
                    // Get appropriate display name
                    let displayName = linkType;
                    if (linkType === 'Other') {
                        // For "Other", try to extract domain name as display
                        try {
                            const urlObj = new URL(formattedUrl);
                            displayName = urlObj.hostname.replace('www.', '').split('.')[0];
                            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                        } catch (e) {
                            displayName = 'Link';
                        }
                    }
                    
                    data.professionalLinks.push({
                        type: linkType,
                        url: formattedUrl,
                        display: displayName // Clean platform name as clickable text
                    });
                    console.log(`Added professional link: ${linkType} -> ${formattedUrl} (display: ${displayName})`);
                }
            }
        }
        
        const degreeEl = document.getElementById('degree');
        if (degreeEl) data.degree = degreeEl.value.trim();
        
        const universityEl = document.getElementById('university');
        if (universityEl) data.university = universityEl.value.trim();
        
        const graduationYearEl = document.getElementById('graduationYear');
        if (graduationYearEl) data.graduationYear = graduationYearEl.value.trim();
        
        const gpaEl = document.getElementById('gpa');
        if (gpaEl) data.gpa = gpaEl.value.trim();
        
        const technicalSkillsEl = document.getElementById('technicalSkills');
        if (technicalSkillsEl) data.technicalSkills = technicalSkillsEl.value.trim();
        
        const softSkillsEl = document.getElementById('softSkills');
        if (softSkillsEl) data.softSkills = softSkillsEl.value.trim();
        
        // Collect all experience entries
        const experienceItems = document.querySelectorAll('.experience-item');
        console.log('Found experience items:', experienceItems.length);
        
        experienceItems.forEach((item, index) => {
            try {
                const titleEl = item.querySelector('.exp-title');
                const companyEl = item.querySelector('.exp-company');
                const durationEl = item.querySelector('.exp-duration');
                const locationEl = item.querySelector('.exp-location');
                const achievementsEl = item.querySelector('.exp-achievements');
                
                const title = titleEl ? titleEl.value.trim() : '';
                const company = companyEl ? companyEl.value.trim() : '';
                const duration = durationEl ? durationEl.value.trim() : '';
                const location = locationEl ? locationEl.value.trim() : '';
                const achievements = achievementsEl ? achievementsEl.value.trim() : '';
                
                if (title || company) {
                    data.experiences.push({
                        title,
                        company,
                        duration,
                        location,
                        achievements
                    });
                    console.log(`Added experience ${index + 1}:`, { title, company });
                }
            } catch (expError) {
                console.error(`Error collecting experience ${index + 1}:`, expError);
            }
        });
        
        console.log('Form data collected successfully:', data);
        return data;
        
    } catch (error) {
        console.error('Error collecting form data:', error);
        throw new Error('Failed to collect form data: ' + error.message);
    }
}

function optimizeForATS(data, analysis) {
    console.log('Optimizing resume for ATS with job analysis:', analysis);
    
    // Enhance skills based on job requirements
    if (analysis.keywords && analysis.keywords.length > 0) {
        const existingSkills = data.technicalSkills.toLowerCase();
        const missingKeywords = analysis.keywords.filter(keyword => 
            !existingSkills.includes(keyword.toLowerCase())
        );
        
        if (missingKeywords.length > 0) {
            data.skillsRecommendation = `Consider adding these skills mentioned in the job description: ${missingKeywords.join(', ')}`;
        }
    }
    
    // Optimize experience descriptions
    data.experiences = data.experiences.map(exp => {
        if (exp.achievements && analysis.keywords) {
            // Add relevant keywords to achievements if not already present
            let optimizedAchievements = exp.achievements;
            analysis.keywords.forEach(keyword => {
                if (!optimizedAchievements.toLowerCase().includes(keyword.toLowerCase())) {
                    // Could enhance this to intelligently add keywords
                }
            });
            return { ...exp, achievements: optimizedAchievements };
        }
        return exp;
    });
    
    return data;
}

function generateResumeHTML(data) {
    console.log('Generating resume HTML for:', data.fullName);
    
    const skillsArray = data.technicalSkills.split(',').map(s => s.trim()).filter(s => s);
    const softSkillsArray = data.softSkills.split(',').map(s => s.trim()).filter(s => s);
    
    // Generate professional links HTML
    const generateLinksHTML = () => {
        if (!data.professionalLinks || data.professionalLinks.length === 0) {
            return '';
        }
        
        const linksHTML = data.professionalLinks
            .filter(link => link.type && link.url)
            .map(link => `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.display}</a>`)
            .join(' <span class="separator">•</span> ');
        
        return linksHTML ? `<br><div class="professional-links">${linksHTML}</div>` : '';
    };
    
    return `
        <div class="resume-container">
            <div id="resumeContent" class="resume-content">
                <!-- Header -->
                <div class="resume-header">
                    <h1 class="name">${data.fullName}</h1>
                    <div class="contact-info">
                        <span class="email">${data.email}</span>
                        <span class="separator"> • </span>
                        <span class="phone">${data.phone}</span>
                        ${data.location ? `<span class="separator"> • </span><span class="location">${data.location}</span>` : ''}
                        ${generateLinksHTML()}
                    </div>
                </div>

                <!-- Professional Summary -->
                <div class="resume-section">
                    <h2 class="section-title">Professional Summary</h2>
                    <p class="summary">
                        ${generateProfessionalSummary(data)}
                    </p>
                </div>

                <!-- Technical Skills -->
                ${skillsArray.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Technical Skills</h2>
                    <div class="skills-list">
                        ${skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join(' ')}
                    </div>
                </div>` : ''}

                <!-- Work Experience -->
                ${data.experiences.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Professional Experience</h2>
                    ${data.experiences.map(exp => `
                        <div class="experience-entry">
                            <div class="exp-header">
                                <div class="exp-title-company">
                                    <h3 class="exp-title">${exp.title}</h3>
                                    <div class="exp-company">${exp.company}</div>
                                </div>
                                <div class="exp-details">
                                    ${exp.duration ? `<div class="exp-duration">${exp.duration}</div>` : ''}
                                    ${exp.location ? `<div class="exp-location">${exp.location}</div>` : ''}
                                </div>
                            </div>
                            ${exp.achievements ? `
                                <div class="exp-achievements">
                                    ${exp.achievements.split('\n').filter(line => line.trim()).map(achievement => {
                                        const cleanAchievement = achievement.replace(/^[•\-\*]\s*/, '').trim();
                                        return cleanAchievement ? `<div class="achievement">• ${cleanAchievement}</div>` : '';
                                    }).filter(a => a).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>` : ''}

                <!-- Education -->
                ${data.degree || data.university ? `
                <div class="resume-section">
                    <h2 class="section-title">Education</h2>
                    <div class="education-entry">
                        <div class="edu-header">
                            <div class="edu-title-school">
                                ${data.degree ? `<h3 class="degree">${data.degree}</h3>` : ''}
                                ${data.university ? `<div class="university">${data.university}</div>` : ''}
                            </div>
                            <div class="edu-details">
                                ${data.graduationYear ? `<div class="grad-year">${data.graduationYear}</div>` : ''}
                                ${data.gpa ? `<div class="gpa">GPA: ${data.gpa}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>` : ''}

                <!-- Additional Skills -->
                ${softSkillsArray.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Additional Skills</h2>
                    <div class="soft-skills">
                        ${softSkillsArray.join(' • ')}
                    </div>
                </div>` : ''}

                ${data.skillsRecommendation ? `
                <div class="recommendations">
                    <h4><i class="fas fa-lightbulb"></i> ATS Optimization Suggestion</h4>
                    <p>${data.skillsRecommendation}</p>
                </div>` : ''}
            </div>
        </div>
    `;
}

function generateProfessionalSummary(data) {
    const experienceCount = data.experiences.length;
    const hasSkills = data.technicalSkills.trim().length > 0;
    const hasDegree = data.degree.trim().length > 0;
    
    let summary = `Professional with `;
    
    if (experienceCount > 0) {
        summary += `proven experience in ${data.experiences[0].title || 'technology'} `;
    }
    
    if (hasDegree) {
        summary += `and ${data.degree.toLowerCase()} background `;
    }
    
    if (hasSkills) {
        const skills = data.technicalSkills.split(',').slice(0, 3).map(s => s.trim()).join(', ');
        summary += `with expertise in ${skills} `;
    }
    
    summary += `seeking to leverage technical skills and experience to contribute to organizational success.`;
    
    return summary;
}

function showSuccessMessage(message) {
    console.log('Success:', message);
}

function downloadResume() {
    console.log('Download Resume button clicked');
    
    // Show loading indicator
    const downloadBtn = document.querySelector('.resume-actions .btn-primary');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;
    
    // Small delay to show loading state
    setTimeout(() => {
        try {
            exportToPDF();
        } finally {
            // Restore button after a delay
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 2000);
        }
    }, 100);
}

function copyToClipboard() {
    console.log('Copy to Clipboard button clicked');
    const resumeContent = document.getElementById('resumeContent');
    if (resumeContent) {
        const text = resumeContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Resume copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Resume copied to clipboard!');
        });
    }
}

function startOver() {
    console.log('Start Over button clicked');
    // Reset all form data
    document.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });
    
    // Reset global variables
    jobAnalysis = {};
    parsedResumeData = {};
    
    // Hide all steps except step 1
    document.querySelectorAll('.step-container').forEach(step => {
        step.style.display = 'none';
    });
    document.getElementById('resumeOutput').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function clearExperienceFields() {
    console.log('Clearing experience fields...');
    const experienceItems = document.querySelectorAll('.experience-item');
    
    experienceItems.forEach(item => {
        const titleField = item.querySelector('.exp-title');
        const companyField = item.querySelector('.exp-company');
        const durationField = item.querySelector('.exp-duration');
        const locationField = item.querySelector('.exp-location');
        const achievementsField = item.querySelector('.exp-achievements');
        
        if (titleField) titleField.value = '';
        if (companyField) companyField.value = '';
        if (durationField) durationField.value = '';
        if (locationField) locationField.value = '';
        if (achievementsField) achievementsField.value = '';
    });
    
    console.log('Experience fields cleared');
}

function skipToExperience() {
    console.log('Skip to Experience button clicked');
    nextStep(3);
}
