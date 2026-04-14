const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const inputPath = path.join(process.env.USERPROFILE, "OneDrive", "바탕 화면", "DB", "시설공사계약서_수정본.docx");

async function main() {
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);
  let xml = await zip.file("word/document.xml").async("string");

  // 기존 잘못 삽입된 제2조~제6조 제거
  // "별첨" 뒤 </w:p> 이후부터, 서명란(공급자 "(인)") 직전까지 삭제
  const byulIdx = xml.indexOf("\uBCC4\uCCA8");
  const byulPEnd = xml.indexOf("</w:p>", byulIdx) + "</w:p>".length;

  // 서명란 찾기: "(인)" 이 포함된 첫 번째 위치 → 그 문단의 <w:p 시작
  const inIdx = xml.indexOf("\uC778)");  // 인)
  const sigPStart = xml.lastIndexOf("<w:p ", inIdx);

  // 서명란 앞에 빈 줄 문단들이 있을 수 있음 - 그것들도 포함해서 찾기
  // sigPStart 앞으로 가면서 빈 문단들의 시작을 찾기
  let cleanStart = byulPEnd;
  let cleanEnd = sigPStart;

  // 기존 양식과 동일한 rPr
  const normalRPr = '<w:rPr><w:rFonts w:ascii="\uD568\uCD08\uB86C\uBC14\uD0D5" w:eastAsia="\uD568\uCD08\uB86C\uBC14\uD0D5" w:hAnsi="\uD568\uCD08\uB86C\uBC14\uD0D5" w:cs="\uD568\uCD08\uB86C\uBC14\uD0D5"/></w:rPr>';
  const boldRPr = '<w:rPr><w:rFonts w:ascii="\uD568\uCD08\uB86C\uBC14\uD0D5" w:eastAsia="\uD568\uCD08\uB86C\uBC14\uD0D5" w:hAnsi="\uD568\uCD08\uB86C\uBC14\uD0D5" w:cs="\uD568\uCD08\uB86C\uBC14\uD0D5"/><w:b/><w:bCs/></w:rPr>';
  const rsid = 'w:rsidR="00E50322" w:rsidRDefault="00180D4F"';

  function makePara(text, center, bold) {
    const rpr = bold ? boldRPr : normalRPr;
    const ppr = center ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : '';
    return `<w:p ${rsid}>${ppr}<w:r>${rpr}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  }

  function emptyPara() {
    return `<w:p ${rsid}><w:r>${normalRPr}<w:t></w:t></w:r></w:p>`;
  }

  const newClauses = [
    emptyPara(),
    makePara("제 2 조 ( 별첨 견적서의 효력 )", true, true),
    makePara(" ① 별첨 견적서는 본 계약의 일부로서 동일한 효력을 가진다.", false, false),
    makePara(" ② 견적서에도 양측(공급자, 계약자) 서명을 받는다.", false, false),
    emptyPara(),
    makePara("제 3 조 ( 검수 및 잔금 지급 )", true, true),
    makePara(" ① 공급자는 공사 완료 후 계약자에게 완료 통보를 하고, 계약자는 통보일로부터 영업일 기준 3일 이내에 검수를 실시한다.", false, false),
    makePara(" ② 계약자의 검수 완료 후 영업일 기준 7일 이내에 잔금을 지급한다.", false, false),
    makePara(" ③ 검수 결과 하자가 발견된 경우, 공급자는 즉시 보수하고 재검수를 받아야 하며, 잔금 지급 기한은 재검수 완료일로부터 기산한다.", false, false),
    emptyPara(),
    makePara("제 4 조 ( 공기 지연 및 지체상금 )", true, true),
    makePara(" ① 공급자의 귀책사유로 공사기간을 초과할 경우, 지체일수 1일당 계약금액의 0.1%를 지체상금으로 계약자에게 지급한다.", false, false),
    makePara(" ② 천재지변, 계약자의 귀책사유 등 불가항력적 사유로 인한 지연은 지체상금 산정에서 제외한다.", false, false),
    makePara(" ③ 지체상금의 총액은 계약금액의 10%를 초과하지 않는다.", false, false),
    emptyPara(),
    makePara("제 5 조 ( 추가 공사 )", true, true),
    makePara(" ① 본 계약에 명시되지 않은 추가 공사가 필요한 경우, 반드시 양 당사자의 서면 합의를 거쳐야 한다.", false, false),
    makePara(" ② 추가 공사의 범위, 금액, 공사기간은 별도 서면 합의서에 명시하며, 서면 합의 없이 진행된 추가 공사에 대해서는 대금을 청구할 수 없다.", false, false),
    emptyPara(),
    makePara("제 6 조 ( 분쟁 해결 )", true, true),
    makePara(" ① 본 계약과 관련하여 분쟁이 발생한 경우, 양 당사자는 우선 협의를 통해 해결한다.", false, false),
    makePara(" ② 협의가 이루어지지 않을 경우, 공사 현장 소재지를 관할하는 수원지방법원을 제1심 관할법원으로 한다.", false, false),
    emptyPara(),
    emptyPara(),
    emptyPara(),
  ].join("");

  // 잘못된 삽입 제거 + 올바른 조항 삽입
  xml = xml.slice(0, cleanStart) + newClauses + xml.slice(cleanEnd);

  zip.file("word/document.xml", xml);
  const output = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(inputPath, output);
  console.log("완료: 기존 서식과 동일한 형식으로 제2조~제6조 추가");
}

main().catch(e => { console.error(e); process.exit(1); });
