// ============================================
// 📄 pdf-parser.js — PDF 텍스트 추출기
// PDF 파일을 읽어서 텍스트만 뽑아내는 도구
// ============================================

const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * PDF 파일에서 텍스트를 추출합니다
 * @param {string} filePath - PDF 파일 경로
 * @returns {object} { text, pages, info }
 */
async function extractTextFromPDF(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(fileBuffer);

  return {
    text: result.text,           // 추출된 전체 텍스트
    pages: result.numpages,      // 총 페이지 수
    info: result.info || {}      // PDF 메타 정보 (제목, 작성자 등)
  };
}

module.exports = { extractTextFromPDF };
