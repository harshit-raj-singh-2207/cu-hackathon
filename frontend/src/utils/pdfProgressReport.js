import { jsPDF } from 'jspdf';

export const generateProgressReportPDF = ({
  plans = [],
  metrics = {},
  activityLog = [],
  isDemoMode = false,
  user = null
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const userName = user?.name || 'Developer';
  const userEmail = user?.email || 'developer@example.com';
  const dateStr = new Date().toISOString().slice(0, 10);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Helper for adding headers and page numbers
  const addPageHeaderFooter = (pageNum, totalPages = 2) => {
    // Subtle top accent line
    doc.setDrawColor(124, 58, 237); // Violet
    doc.setLineWidth(1);
    doc.line(margin, 10, pageWidth - margin, 10);

    // Bottom Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Muted gray
    doc.text('AI Career Copilot · Personalized Learner Analytics', margin, pageHeight - 10);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  const checkPageBreak = (requiredSpace) => {
    if (currentY + requiredSpace > pageHeight - 20) {
      doc.addPage();
      currentY = margin + 5;
      addPageHeaderFooter(doc.internal.getNumberOfPages());
    }
  };

  // Initial Page Header
  addPageHeaderFooter(1);

  // --- BRANDING & HEADER ---
  doc.setFillColor(15, 23, 42); // Dark slate bg
  doc.rect(margin, currentY, contentWidth, 32, 'F');

  // Title Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(248, 250, 252); // White
  doc.text('AI CAREER COPILOT', margin + 8, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(167, 139, 250); // Light purple
  doc.text('Personalized Progress Report', margin + 8, currentY + 18);

  // Learner Meta (Right aligned)
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`Learner: ${userName}`, pageWidth - margin - 8, currentY + 11, { align: 'right' });
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 8, currentY + 17, { align: 'right' });
  
  if (isDemoMode) {
    doc.setFillColor(234, 179, 8); // Yellow badge
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.rect(pageWidth - margin - 38, currentY + 21, 30, 5, 'F');
    doc.text('DEMO DATA', pageWidth - margin - 23, currentY + 24.5, { align: 'center' });
  }

  currentY += 38;

  // --- SECTION 1: OVERALL PROGRESS SUMMARY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Overall Roadmap Progress', margin, currentY);
  currentY += 6;

  // Progress Box Container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 30, 3, 3, 'FD');

  // Big Percentage
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(124, 58, 237);
  doc.text(`${metrics.percent || 0}%`, margin + 10, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Completion', margin + 10, currentY + 24);

  // Status Metrics Breakdown Columns
  const startColX = margin + 55;
  const colWidth = 30;

  // Completed
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`${metrics.completedSteps || 0}`, startColX, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Completed', startColX, currentY + 21);

  // In Progress
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6); // Amber
  doc.text(`${metrics.statusCounts?.current || 0}`, startColX + colWidth, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('In Progress', startColX + colWidth, currentY + 21);

  // Locked
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139); // Gray
  doc.text(`${metrics.statusCounts?.locked || 0}`, startColX + colWidth * 2, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Locked', startColX + colWidth * 2, currentY + 21);

  // Total Tasks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(14, 116, 144); // Cyan
  doc.text(`${metrics.completedTasks || 0} / ${metrics.totalTasks || 0}`, startColX + colWidth * 3.2, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tasks Done', startColX + colWidth * 3.2, currentY + 21);

  currentY += 36;

  // --- SECTION 2: TOPIC-WISE PROGRESS BREAKDOWN ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Category & Topic Breakdown', margin, currentY);
  currentY += 6;

  // Topic Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TOPIC / CATEGORY', margin + 4, currentY + 5);
  doc.text('STEPS', margin + 80, currentY + 5);
  doc.text('CHECKLIST TASKS', margin + 115, currentY + 5);
  doc.text('COMPLETION', pageWidth - margin - 4, currentY + 5, { align: 'right' });

  currentY += 7;

  const topics = Object.keys(metrics.topicStats || {});
  if (topics.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No topic categories registered.', margin + 4, currentY + 6);
    currentY += 10;
  } else {
    topics.forEach((topic, idx) => {
      checkPageBreak(10);
      const stat = metrics.topicStats[topic];
      const pct = stat.total > 0 ? Math.round((stat.checked / stat.total) * 100) : 0;

      // Row background zebra striping
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 8, 'F');
      }

      doc.setFont('helvetica', 'semibold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(topic, margin + 4, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${stat.completedSteps} / ${stat.steps}`, margin + 80, currentY + 5.5);
      doc.text(`${stat.checked} / ${stat.total}`, margin + 115, currentY + 5.5);

      // Percentage & Mini bar
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pct >= 60 ? 22 : 220, pct >= 60 ? 163 : 38, pct >= 60 ? 74 : 38);
      doc.text(`${pct}%`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

      currentY += 8;
    });
  }

  currentY += 6;

  // --- SECTION 3: WEAK AREA ANALYSIS ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Weak Area Analysis (< 60% Completion)', margin, currentY);
  currentY += 6;

  if (metrics.weakAreas && metrics.weakAreas.length > 0) {
    metrics.weakAreas.forEach(area => {
      checkPageBreak(16);
      doc.setFillColor(254, 242, 242); // Light red
      doc.setDrawColor(252, 165, 165);
      doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`⚠️ ${area.topic} (${area.completionPercent}% complete)`, margin + 5, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Action: ${area.recommendation}`, margin + 5, currentY + 10.5);

      currentY += 17;
    });
  } else {
    doc.setFillColor(240, 253, 244); // Light green
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61);
    doc.text('✓ No major weak areas detected.', margin + 5, currentY + 7.5);

    currentY += 15;
  }

  currentY += 4;

  // --- SECTION 4: AI RECOMMENDED NEXT ACTION ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. AI Recommended Next Milestone', margin, currentY);
  currentY += 6;

  if (metrics.nextAction) {
    doc.setFillColor(245, 243, 255); // Light purple
    doc.setDrawColor(221, 214, 254);
    doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(109, 40, 217);
    doc.text(`💡 Target: ${metrics.nextAction.stepTitle || 'N/A'}`, margin + 5, currentY + 6);

    doc.setFont('helvetica', 'semibold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Key Task: ${metrics.nextAction.taskName || 'N/A'}`, margin + 5, currentY + 11);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rationale: ${metrics.nextAction.reason || 'N/A'}`, margin + 5, currentY + 16);

    currentY += 24;
  }

  // --- SECTION 5: RECENT ACTIVITY FEED ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Recent Learner Activity Log', margin, currentY);
  currentY += 6;

  const activities = (activityLog || []).slice(0, 4);
  if (activities.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No recent learner activity logged.', margin, currentY + 4);
    currentY += 10;
  } else {
    activities.forEach(act => {
      checkPageBreak(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${act.text}`, margin + 4, currentY + 4);
      doc.setTextColor(148, 163, 184);
      doc.text(`(${act.timestamp})`, pageWidth - margin - 4, currentY + 4, { align: 'right' });
      currentY += 6;
    });
  }

  // =========================================================
  // PAGE 2: CAREER LEARNING PROGRESS CERTIFICATE
  // =========================================================
  doc.addPage();
  addPageHeaderFooter(2, 2);
  currentY = 20;

  // Certificate Decorative Outer Border
  doc.setDrawColor(124, 58, 237); // Violet border
  doc.setLineWidth(1.5);
  doc.rect(margin, currentY, contentWidth, 235);

  // Inner Subtle Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(margin + 4, currentY + 4, contentWidth - 8, 227);

  let certY = currentY + 25;

  // Top Crest Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(124, 58, 237);
  doc.text('✦ AI CAREER COPILOT ✦', pageWidth / 2, certY, { align: 'center' });

  certY += 12;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('CAREER LEARNING PROGRESS CERTIFICATE', pageWidth / 2, certY, { align: 'center' });

  certY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('This document certifies the self-paced learning milestones achieved by', pageWidth / 2, certY, { align: 'center' });

  certY += 16;

  // Learner Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(124, 58, 237);
  doc.text(userName, pageWidth / 2, certY, { align: 'center' });

  // Underline decor
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 40, certY + 3, pageWidth / 2 + 40, certY + 3);

  certY += 20;

  // Achievement Banner
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(margin + 20, certY, contentWidth - 40, 30, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(109, 40, 217);
  doc.text(`${metrics.percent || 0}% ROADMAP PROGRESS COMPLETED`, pageWidth / 2, certY + 12, { align: 'center' });

  doc.setFont('helvetica', 'semibold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Successfully completed ${metrics.completedSteps} of ${metrics.totalSteps} structured career plan steps`, pageWidth / 2, certY + 21, { align: 'center' });

  certY += 45;

  // Meta Info Table
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  const targetRole = plans[0]?.goal || 'Fullstack Engineer';

  doc.text(`Primary Career Goal:`, pageWidth / 2 - 10, certY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(targetRole, pageWidth / 2 + 5, certY);

  certY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Checklist Tasks Mastered:`, pageWidth / 2 - 10, certY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${metrics.completedTasks} / ${metrics.totalTasks} Tasks`, pageWidth / 2 + 5, certY);

  certY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date Issued:`, pageWidth / 2 - 10, certY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(dateStr, pageWidth / 2 + 5, certY);

  certY += 35;

  // Disclaimer Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 15, certY, contentWidth - 30, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL PROGRESS RECORD DISCLAIMER', pageWidth / 2, certY + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimerText = 'This progress certificate is issued by AI Career Copilot as an automated record of self-paced learning progression and skill task completions. It does not constitute an accredited university degree or third-party professional certification.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 40);
  doc.text(splitDisclaimer, pageWidth / 2, certY + 11, { align: 'center' });

  // Save / Trigger Download
  const filename = `AI-Career-Copilot-Progress-Report-${dateStr}.pdf`;
  doc.save(filename);
  return filename;
};
