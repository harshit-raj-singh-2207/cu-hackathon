// Utility module for rendering high-resolution 1200x630px Social Media Progress Cards using HTML5 Canvas 2D API.

export const createSocialCardCanvas = ({
  plans = [],
  metrics = {},
  user = null,
  isDemoMode = false
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  const userName = user?.name || 'Developer';
  const primaryGoal = plans[0]?.goal || 'Fullstack Engineer';
  const percent = Math.max(0, Math.min(100, Math.round(metrics.percent || 0)));
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // --- 1. BACKGROUND & AURORA GRADIENTS ---
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#0b0f19');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // Aurora Glow Orbs
  const glow1 = ctx.createRadialGradient(150, 100, 10, 150, 100, 350);
  glow1.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
  glow1.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.arc(150, 100, 350, 0, Math.PI * 2);
  ctx.fill();

  const glow2 = ctx.createRadialGradient(1050, 500, 10, 1050, 500, 400);
  glow2.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
  glow2.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(1050, 500, 400, 0, Math.PI * 2);
  ctx.fill();

  // Decorative Card Border Frame
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
  ctx.lineWidth = 4;
  roundRect(ctx, 30, 30, 1140, 570, 24, false, true);

  // --- 2. HEADER BRANDING ---
  // Icon Badge Box
  ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 70, 65, 54, 54, 14, true, true);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'center';
  ctx.fillText('✦', 97, 102);

  // App Title
  ctx.textAlign = 'left';
  ctx.font = '900 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AI CAREER COPILOT', 140, 93);

  ctx.font = '600 16px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Personalized Learner Progress Report', 140, 114);

  // Demo Mode Badge (Top Right)
  if (isDemoMode) {
    ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 990, 65, 140, 32, 16, true, true);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 DEMO MODE', 1060, 86);
  }

  // --- 3. LEARNER INFO HERO CARD (Left Column) ---
  // Glass Card Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 70, 145, 500, 420, 20, true, true);

  // Learner Name
  ctx.textAlign = 'left';
  ctx.font = '800 28px sans-serif';
  ctx.fillStyle = '#ffffff';
  const truncatedName = userName.length > 24 ? userName.slice(0, 22) + '...' : userName;
  ctx.fillText(truncatedName, 100, 195);

  // Primary Goal Tag Pill
  ctx.fillStyle = 'rgba(124, 58, 237, 0.25)';
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
  roundRect(ctx, 100, 210, 280, 30, 15, true, true);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(`🎯 Goal: ${primaryGoal.length > 22 ? primaryGoal.slice(0, 20) + '...' : primaryGoal}`, 115, 230);

  // BIG PERCENTAGE HERO DISPLAY
  const heroGrad = ctx.createLinearGradient(100, 280, 100, 360);
  heroGrad.addColorStop(0, '#c4b5fd');
  heroGrad.addColorStop(1, '#818cf8');
  ctx.fillStyle = heroGrad;
  ctx.font = '900 96px sans-serif';
  ctx.fillText(`${percent}%`, 100, 340);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Roadmap Completed', 330, 315);

  // Main Progress Bar Track
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  roundRect(ctx, 100, 370, 440, 18, 9, true, false);

  // Progress Bar Fill
  if (percent > 0) {
    const fillWidth = Math.max(18, (440 * percent) / 100);
    const barGrad = ctx.createLinearGradient(100, 0, 540, 0);
    barGrad.addColorStop(0, '#8b5cf6');
    barGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = barGrad;
    roundRect(ctx, 100, 370, fillWidth, 18, 9, true, false);
  }

  // Statistics Row Inside Left Hero Box
  // Column 1: Steps Done
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#4ade80'; // Green
  ctx.fillText(`${metrics.completedSteps || 0} / ${metrics.totalSteps || 0}`, 100, 445);
  ctx.font = '600 13px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Steps Completed', 100, 468);

  // Column 2: Tasks Done
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#38bdf8'; // Cyan
  ctx.fillText(`${metrics.completedTasks || 0} / ${metrics.totalTasks || 0}`, 260, 445);
  ctx.font = '600 13px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Tasks Mastered', 260, 468);

  // Column 3: In Progress
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#fbbf24'; // Amber
  ctx.fillText(`${metrics.statusCounts?.current || 0}`, 420, 445);
  ctx.font = '600 13px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('In Progress', 420, 468);

  // Footer inside left box
  ctx.font = '500 12px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Verified Progress Record · ${dateStr}`, 100, 525);

  // --- 4. TOPIC CATEGORIES CARD (Right Column) ---
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 600, 145, 530, 420, 20, true, true);

  ctx.textAlign = 'left';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🏷️ Top Learning Categories', 630, 190);

  // Top 3 Topics
  const topicKeys = Object.keys(metrics.topicStats || {}).slice(0, 3);
  let topicY = 220;

  if (topicKeys.length === 0) {
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('No learning categories registered.', 630, 250);
  } else {
    topicKeys.forEach((topic) => {
      const stat = metrics.topicStats[topic];
      const topicPct = stat.total > 0 ? Math.round((stat.checked / stat.total) * 100) : 0;

      // Category Box
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      roundRect(ctx, 630, topicY, 470, 85, 12, true, true);

      // Topic Name
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#f8fafc';
      const truncTopic = topic.length > 25 ? topic.slice(0, 23) + '...' : topic;
      ctx.fillText(truncTopic, 650, topicY + 30);

      // Percentage
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = topicPct >= 60 ? '#4ade80' : '#f87171';
      ctx.textAlign = 'right';
      ctx.fillText(`${topicPct}%`, 1080, topicY + 30);

      // Mini Progress Bar
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      roundRect(ctx, 650, topicY + 45, 430, 10, 5, true, false);

      if (topicPct > 0) {
        const miniBarWidth = Math.max(10, (430 * topicPct) / 100);
        ctx.fillStyle = topicPct >= 60 ? '#22c55e' : '#ef4444';
        roundRect(ctx, 650, topicY + 45, miniBarWidth, 10, 5, true, false);
      }

      // Task count label
      ctx.font = '500 12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${stat.checked} of ${stat.total} checklist tasks completed`, 650, topicY + 70);

      topicY += 100;
    });
  }

  // Card Footer Branding (Bottom Right)
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('Powered by AI Career Copilot', 1100, 530);

  return canvas;
};

// Helper function to draw rounded rectangles on Canvas
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Convert canvas to PNG Blob
export const generateSocialCardBlob = (options) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = createSocialCardCanvas(options);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      }, 'image/png');
    } catch (e) {
      reject(e);
    }
  });
};

// Trigger browser download of 1200x630 PNG file
export const downloadSocialCardImage = (options) => {
  const canvas = createSocialCardCanvas(options);
  const dataUrl = canvas.toDataURL('image/png');
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `AI-Career-Copilot-Progress-Card-${dateStr}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Copy PNG Blob to System Clipboard
export const copySocialCardToClipboard = async (options) => {
  const blob = await generateSocialCardBlob(options);
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Image clipboard API is not supported in this browser. Please use Download PNG instead.');
  }
  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
};
