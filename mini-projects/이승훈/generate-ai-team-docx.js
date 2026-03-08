const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require("docx");
const fs = require("fs");

async function generate() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "맑은 고딕", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // 제목
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "AI 시대, 팀 성과를 지키는 법",
                bold: true,
                size: 36,
                font: "맑은 고딕",
              }),
            ],
          }),
          // 부제
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "\"AI 때문에 개인생산성 높아졌는데 팀성과 줄어든 이유\"",
                size: 24,
                italics: true,
                color: "666666",
                font: "맑은 고딕",
              }),
            ],
          }),
          // 출처
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "출처: 티타임즈TV — 배수정 SK아카데미 RF",
                size: 20,
                color: "999999",
                font: "맑은 고딕",
              }),
            ],
          }),

          // 구분선
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
            spacing: { after: 300 },
            children: [],
          }),

          // 핵심 메시지
          new Paragraph({
            spacing: { after: 200 },
            shading: { fill: "F0F4FF" },
            children: [
              new TextRun({
                text: "💡 핵심 메시지: ",
                bold: true,
                size: 22,
                font: "맑은 고딕",
              }),
              new TextRun({
                text: "AI 시대의 팀워크는 기술을 얼마나 쓰느냐가 아니라, AI를 활용하는 업무 방식에 맞춰 팀의 규칙과 문화를 재설계하는 것에 달려 있다.",
                size: 22,
                font: "맑은 고딕",
              }),
            ],
          }),

          // Section 1
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: "1. AI 도입과 '프로세스 손실'의 발생",
                bold: true,
                size: 28,
                color: "1a365d",
                font: "맑은 고딕",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "팀 성과 = 잠재 성과(개인 역량의 합) - 프로세스 손실",
                bold: true,
                size: 22,
                font: "맑은 고딕",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "AI는 개인의 역량을 높여 잠재 성과를 키우지만, 동시에 네 가지 프로세스 손실을 야기합니다.",
                size: 22,
                font: "맑은 고딕",
              }),
            ],
          }),

          // 4가지 손실
          ...[
            {
              title: "① 저자의 실종",
              desc: "\"AI가 해줬다\"며 판단과 책임을 회피 → 피드백과 개선의 대상이 사라짐",
            },
            {
              title: "② 학습의 증발",
              desc: "시행착오('삽질') 과정이 AI로 대체 → 주니어의 성장 기회가 사라짐",
            },
            {
              title: "③ 대화의 소멸",
              desc: "동료 간 토론 대신 AI와만 소통 → 팀 내 경험·인사이트 공유 감소",
            },
            {
              title: "④ 심리적 안전감 하락",
              desc: "AI를 못 쓰는 것처럼 보일까 봐 질문을 못함 → 전문성 대체 위기감",
            },
          ].flatMap((item) => [
            new Paragraph({
              spacing: { before: 150, after: 80 },
              indent: { left: 360 },
              children: [
                new TextRun({
                  text: item.title,
                  bold: true,
                  size: 22,
                  font: "맑은 고딕",
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 100 },
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: item.desc,
                  size: 22,
                  font: "맑은 고딕",
                }),
              ],
            }),
          ]),

          // Section 2
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: "2. 팀 내 갈등과 구조적 문제",
                bold: true,
                size: 28,
                color: "1a365d",
                font: "맑은 고딕",
              }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "AI 활용 능력의 차이 → 팀원 간 속도 격차 → 미묘한 불신",
                size: 22,
                font: "맑은 고딕",
              }),
            ],
          }),

          ...[
            {
              title: "초안에 대한 관점 차이",
              desc: "숙련자에게 초안은 '재료', 비숙련자에게는 '중간 결과물' → 협업 박자 불일치",
            },
            {
              title: "기존 프로세스와의 충돌",
              desc: "개인이 AI로 빠르게 만들어도, 팀 일정·KPI가 과거 방식에 머물면 성과 반영 어려움",
            },
            {
              title: "지식의 저주",
              desc: "숙련자가 초심자 관점을 공감 못하고 어려운 AI 용어 사용 → 격차 확대",
            },
          ].flatMap((item) => [
            new Paragraph({
              spacing: { before: 150, after: 80 },
              indent: { left: 360 },
              children: [
                new TextRun({
                  text: "▸ " + item.title,
                  bold: true,
                  size: 22,
                  font: "맑은 고딕",
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 100 },
              indent: { left: 720 },
              children: [
                new TextRun({
                  text: item.desc,
                  size: 22,
                  font: "맑은 고딕",
                }),
              ],
            }),
          ]),

          // Section 3
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: "3. AI 시대의 새로운 리더십과 팀워크",
                bold: true,
                size: 28,
                color: "1a365d",
                font: "맑은 고딕",
              }),
            ],
          }),

          // 리더 역할
          new Paragraph({
            spacing: { before: 200, after: 100 },
            shading: { fill: "FFF8E1" },
            children: [
              new TextRun({
                text: "🔹 리더의 역할",
                bold: true,
                size: 24,
                font: "맑은 고딕",
              }),
            ],
          }),

          ...[
            "'빨리'보다 '제대로 되었는지' 검토하는 사람이 되기",
            "팀 내 AI 용어를 공용화하기",
            "그라운드 룰 설정: \"자료 조사는 AI, 판단은 사람\"",
          ].map(
            (text) =>
              new Paragraph({
                spacing: { after: 80 },
                indent: { left: 720 },
                children: [
                  new TextRun({
                    text: "• " + text,
                    size: 22,
                    font: "맑은 고딕",
                  }),
                ],
              })
          ),

          // 팀원 역할
          new Paragraph({
            spacing: { before: 200, after: 100 },
            shading: { fill: "E8F5E9" },
            children: [
              new TextRun({
                text: "🔹 팀원의 역할",
                bold: true,
                size: 24,
                font: "맑은 고딕",
              }),
            ],
          }),

          ...[
            "AI 활용 범위를 투명하게 공유하기",
            "AI가 답을 줘도 동료에게 한번 더 의견 묻기",
            "실패 경험 공유 → 심리적 안전감 확보",
            "동료의 진척 상황을 살피는 배려",
          ].map(
            (text) =>
              new Paragraph({
                spacing: { after: 80 },
                indent: { left: 720 },
                children: [
                  new TextRun({
                    text: "• " + text,
                    size: 22,
                    font: "맑은 고딕",
                  }),
                ],
              })
          ),

          // 구분선
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
            spacing: { before: 400, after: 300 },
            children: [],
          }),

          // 팀 토론 질문
          new Paragraph({
            spacing: { after: 200 },
            shading: { fill: "FFF3E0" },
            children: [
              new TextRun({
                text: "📌 팀 토론 질문",
                bold: true,
                size: 24,
                font: "맑은 고딕",
              }),
            ],
          }),

          ...[
            "우리 팀에서 '저자의 실종'이 일어나고 있는 영역은?",
            "AI 활용 수준 차이로 인한 갈등이 있었다면, 어떻게 해소할 수 있을까?",
            "우리 팀만의 AI 그라운드 룰을 만든다면 어떤 항목이 필요할까?",
          ].map(
            (text, i) =>
              new Paragraph({
                spacing: { after: 100 },
                indent: { left: 360 },
                children: [
                  new TextRun({
                    text: `${i + 1}. ${text}`,
                    size: 22,
                    font: "맑은 고딕",
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "C:\\Users\\leeha\\OneDrive\\바탕 화면\\AI시대-팀성과-학습자료.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("완료: " + outputPath);
}

generate().catch(console.error);
