import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add mammoth import near top if not there
if (!content.includes('mammoth')) {
   content = content.replace("import ", "import * as mammoth from 'mammoth';\nimport ");
}

// Add docx parser block inside handleKbFileUpload before the final isText handler
if (!content.includes("extension === 'docx'")) {
    const docxBlock = `    if (extension === 'docx') {
      const docxReader = new FileReader();
      docxReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) throw new Error('DOCX file is empty.');
          toast.loading('Extracting text from Word document...', { id: 'docx-load' });
          const result = await mammoth.extractRawText({ arrayBuffer });
          const extractedText = result.value || 'No readable text content found in document.';
          if (result.messages && result.messages.length > 0) console.warn(result.messages);
          const newDoc = {
            id: \`kb_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`,
            name: file.name,
            type: 'DOCX',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedAt: new Date().toISOString(),
            content: extractedText,
            size: file.size,
            isBinary: false
          };
          setKnowledgeBaseDocuments(prev => [newDoc, ...prev]);
          setSelectedKbDocId(newDoc.id);
          toast.success(\`"\${file.name}" indexed successfully!\`, { id: 'docx-load' });
        } catch (err: any) {
          toast.error('Failed to parse Word Document: ' + err.message, { id: 'docx-load' });
        }
      };
      docxReader.onerror = () => toast.error('Failed to read the selected DOCX file.');
      docxReader.readAsArrayBuffer(file);
      return;
    }
`;
    // Insert before `const textExtensions = `
    const targetStr = "    const textExtensions = ['txt'";
    content = content.replace(targetStr, docxBlock + '\n' + targetStr);
}

fs.writeFileSync('src/App.tsx', content);
