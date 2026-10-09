const links = [...document.querySelectorAll("[data-route]")];
const views = [...document.querySelectorAll("[data-view]")];
const app = document.querySelector("#app");
const worksTalk = document.querySelector(".works-talk");
const wechatDialog = document.querySelector("#wechat-dialog");
const wechatClose = document.querySelector(".wechat-close");
const wechatCard = document.querySelector(".wechat-card");
const wechatRope = document.querySelector(".wechat-rope");
const wechatRopeTop = document.querySelector(".wechat-rope-top");
const wechatRopeTail = document.querySelector(".wechat-rope-tail");
const wechatBottomBead = document.querySelector(".wechat-bead-bottom");
let wechatMotionFrame = 0;
let wechatMotion = null;
let worksTalkLastY = 0;
let worksTalkFrame = 0;

function paintWechat() {
  if (!wechatMotion) return;
  const { x, y, vx } = wechatMotion;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cardWidth = wechatCard.offsetWidth;
  const cardHeight = wechatCard.offsetHeight;
  const anchorX = width / 2;
  const cardTop = y - cardHeight / 2;
  const cardBottom = y + cardHeight / 2;
  const idleSway = wechatMotion.idle
    ? Math.sin((wechatMotion.swayTime - wechatMotion.idleStart) / 950) * 11
      + Math.sin((wechatMotion.swayTime - wechatMotion.idleStart) / 1510) * 2
    : 0;
  const cardX = x + idleSway;
  const angle = Math.max(-11, Math.min(11, (x - anchorX) * .022 - vx * .002 + idleSway * .045));
  const curve = Math.max(-54, Math.min(54, -vx * .022 + idleSway * .35));
  const lineEnd = Math.max(29, cardTop + 3);
  const tailX = cardX + Math.sin(angle * Math.PI / 180) * cardHeight * .34;
  const beadX = tailX + Math.max(-21, Math.min(21, -vx * .014)) + idleSway * .14;
  const beadY = Math.min(height - 22, cardBottom + 70);

  wechatCard.style.transform = `translate3d(${cardX - cardWidth / 2}px, ${cardTop}px, 0) rotate(${angle}deg)`;
  wechatRope.setAttribute("viewBox", `0 0 ${width} ${height}`);
  wechatRopeTop.setAttribute("d", `M ${anchorX} 29 C ${anchorX + curve * .5} ${Math.max(45, lineEnd * .36)}, ${cardX - (cardX - anchorX) * .22 + curve} ${Math.max(38, lineEnd * .75)}, ${cardX} ${lineEnd}`);
  wechatRopeTail.setAttribute("d", `M ${tailX} ${cardBottom - 2} Q ${tailX + curve * .5} ${cardBottom + 40}, ${beadX} ${beadY}`);
  wechatBottomBead.style.transform = `translate3d(${beadX - 11}px, ${beadY - 7.5}px, 0)`;
}

function startWechatDrop() {
  cancelAnimationFrame(wechatMotionFrame);
  const anchorX = window.innerWidth / 2;
  const cardHeight = wechatCard.offsetHeight;
  const targetY = Math.min(
    Math.max(cardHeight / 2 + 72, window.innerHeight * .53),
    window.innerHeight - cardHeight / 2 - 86
  );
  wechatMotion = {
    x: anchorX + Math.min(300, window.innerWidth * .32),
    y: -cardHeight * .42,
    vx: 0,
    vy: 0,
    targetY,
    started: 0,
    last: 0,
    idle: false,
    swayTime: 0,
    idleStart: 0
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    wechatMotion.x = anchorX;
    wechatMotion.y = targetY;
    paintWechat();
    return;
  }
  paintWechat();
  const step = time => {
    if (wechatDialog.hidden || !wechatMotion) return;
    const motion = wechatMotion;
    if (motion.idle) {
      motion.swayTime = time;
      paintWechat();
      wechatMotionFrame = requestAnimationFrame(step);
      return;
    }
    if (!motion.started) motion.started = time;
    const dt = Math.min(.035, (time - (motion.last || time - 16)) / 1000);
    motion.last = time;
    const stiffness = 8.2 ** 2;
    const damping = 2 * .4 * 8.2;
    motion.vx += (-stiffness * (motion.x - window.innerWidth / 2) - damping * motion.vx) * dt;
    motion.vy += (-stiffness * (motion.y - motion.targetY) - damping * motion.vy) * dt;
    motion.x += motion.vx * dt;
    motion.y += motion.vy * dt;
    paintWechat();
    if (time - motion.started > 2800 && Math.abs(motion.vx) < 2 && Math.abs(motion.vy) < 2) {
      motion.x = window.innerWidth / 2;
      motion.y = motion.targetY;
      motion.vx = motion.vy = 0;
      motion.idle = true;
      motion.swayTime = time;
      motion.idleStart = time;
      paintWechat();
      wechatMotionFrame = requestAnimationFrame(step);
      return;
    }
    wechatMotionFrame = requestAnimationFrame(step);
  };
  wechatMotionFrame = requestAnimationFrame(step);
}

function closeWechat(restoreFocus = true) {
  if (wechatDialog.hidden) return;
  cancelAnimationFrame(wechatMotionFrame);
  wechatMotionFrame = 0;
  wechatMotion = null;
  wechatDialog.hidden = true;
  document.body.classList.remove("wechat-open");
  worksTalk.setAttribute("aria-expanded", "false");
  if (restoreFocus && worksTalk.classList.contains("is-visible")) worksTalk.focus();
}

worksTalk.addEventListener("click", () => {
  wechatDialog.hidden = false;
  document.body.classList.add("wechat-open");
  worksTalk.setAttribute("aria-expanded", "true");
  startWechatDrop();
  wechatClose.focus();
});
window.addEventListener("resize", () => {
  if (wechatDialog.hidden || !wechatMotion) return;
  const cardHeight = wechatCard.offsetHeight;
  wechatMotion.targetY = Math.min(Math.max(cardHeight / 2 + 72, innerHeight * .53), innerHeight - cardHeight / 2 - 86);
  paintWechat();
});
wechatClose.addEventListener("click", () => closeWechat());
document.querySelector(".wechat-backdrop").addEventListener("click", () => closeWechat());
document.addEventListener("keydown", event => {
  if (wechatDialog.hidden) return;
  if (event.key === "Escape") { event.preventDefault(); closeWechat(); }
  if (event.key === "Tab") { event.preventDefault(); wechatClose.focus(); }
});

const projects = {
  jingjingyu: {
    title: "《寂鲸语》", kicker: "SOUND VISUALIZATION", year: "2024", tools: "Adobe After Effects（AE）",
    image: "./assets/jingjingyu/concept.jpg", alt: "《寂鲸语》概念视频画面", video: "./assets/jingjingyu/concept.mp4",
    description: "《寂鲸语》是一件关注海洋噪声污染的声音可视化作品。作品将悠扬的座头鲸之歌与嘈杂的船舶噪声并置，通过图形转译与动态编排，让声音的碰撞、交错与融合成为可见的视觉体验。四段交互影像连接不同历史时期的海洋声环境，呈现人类航行活动与鲸类生命之间的复杂交织。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["随着工业化与航运活动的发展，船舶噪声持续介入海洋声环境，影响海洋生物的行为与交流。对于依靠声音交流的座头鲸而言，这种干扰尤为值得关注。", "作品以船舶与座头鲸为研究对象，将调研划分为15—19世纪、19—20世纪、20—21世纪及21世纪四个时间段，围绕船舶噪声、航线及其与座头鲸洄游路线的交汇展开研究，追溯航运发展与鲸类活动之间的关联。"]},
      {title: "Approach｜设计过程", paragraphs: ["作品以声音的差异与交织作为视觉创作的起点，将座头鲸之歌与船舶噪声转译为图形语言，并通过编排呈现两种声音之间的关系。", "转译后的图形以动态形式与声音互动，使听觉中的碰撞与融合延伸为视觉中的运动与变化。四个调研时间段分别对应四段交互影像，将历史线索、声音素材与动态图形组织为连续的体验。"]},
      {title: "Outcome｜项目成果", paragraphs: ["作品最终形成四段结合声音与动态图形的交互影像，以不同历史时期为线索，呈现鲸歌与船舶噪声共存的海洋声环境。通过让声音变得可见，作品邀请观众感知海洋中不易察觉的噪声干扰，并思考人类活动与海洋生命的关系。"]}
    ],
    chapters: ["第一章", "第二章", "第三章", "第四章"].map((title,index)=>({title,video:`./assets/jingjingyu/chapter-${index+1}.mp4`,poster:`./assets/jingjingyu/chapter-${index+1}.jpg`}))
  },
  lou: {
    title: "《楼》", kicker: "GENERATIVE VISUAL", year: "2023", tools: "TouchDesigner",
    image: "./assets/lou/cover.jpg", alt: "《楼》动态影像画面", video: "./assets/lou/part-1.mp4", videoSequence: ["./assets/lou/part-1.mp4", "./assets/lou/part-2.mp4", "./assets/lou/part-3.mp4", "./assets/lou/part-4.mp4"],
    description: "《楼》是一件探讨城市发展与个体生活关系的作品。作品以楼房为核心意象，将建筑从低矮、稀疏到高耸、密集的变化，与快节奏生活中不断累积的压力相联系。通过“迷、复、抑、淡”四个阶段，作品呈现城市空间扩张与人的心理变化之间的呼应，思考繁荣之下个体如何感受、承受并回应城市生活。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["城市化改变着城市的面貌，也重新塑造着人们的日常。平房被高楼取代，居住条件与生活便利性不断改善；与此同时，生活节奏加快、竞争愈发激烈，个人需要面对的要求与负担也随之增加。楼房是这些变化最直观的载体。层层叠压的建筑既呈现了城市中人群聚居的状态，也成为个人多重压力的隐喻。作品由此出发，关注城市繁荣与个体感受之间的张力。"]},
      {title: "Approach｜设计过程", paragraphs: ["作品使用 TouchDesigner，以楼房形态的持续变化组织视觉叙事，将建筑的数量、密度与层叠关系转化为表达心理状态的语言。“迷、复、抑、淡”构成四个递进的感受阶段：“迷”指向身处快速变化之中的迷失；“复”对应重复的日常与不断叠加的负担；“抑”呈现空间拥挤与心理压力累积后的压迫感；“淡”则转向压力之后的疏离与淡漠，留下个体如何回应城市生活的开放思考。"]},
      {title: "Outcome｜项目成果", paragraphs: ["作品通过不断变化的楼房形态，将城市发展的宏观景象转化为对个体生活的感知。建筑的层叠既是城市空间的生长，也是心理负担的累积，使观众在观看“楼”的变化时，重新审视自身与城市、生活节奏及竞争压力之间的关系。"]}
    ]
  },
  liangyou: {
    title: "《良酉》", kicker: "VIRTUAL BRAND / 3D", year: "2023", tools: "Cinema 4D",
    image: "./assets/liangyou/cover.jpg", alt: "《良酉》虚拟酒馆三维场景", video: "./assets/liangyou/full.mp4",
    description: "《良酉》是一个面向 Z 世代的概念酒饮品牌，以“情绪与酒”为核心，将情绪与不同颜色、口感的果汁酒饮相联系。“良酉酒馆”是基于此品牌创立的情绪酒饮实验室，在这里，酒饮没有标准配方，消费者可以采集自己当下的感受，调整不同情绪的比例，生成一杯只属于此刻的酒饮。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["随着创意酒饮的选择日益丰富，Z 世代年轻消费者更愿意尝试不同风味与玩法，并根据个人喜好、当下心情与社交场景选择饮品。他们的需求也从口味延伸至饮品的颜色、品牌故事与空间氛围，追求更有新鲜感和参与感的消费体验。"]},
      {title: "Approach｜设计过程", paragraphs: ["品牌将六种基本情绪对应为不同颜色、口感与酒饮参数，并以化学器皿、试剂瓶、刻度与白大褂等视觉元素建立实验室式的酒馆体验，消费者通过“情绪采样—比例调节—味觉转译—配方生成”完成调酒过程，让一杯酒同时呈现当下的感受与希望抵达的情绪状态。"]},
      {title: "Outcome｜项目成果", paragraphs: ["良酉酒馆建立了一套从情绪到酒饮的转译机制，每杯酒都拥有独特的颜色、口感、名字与情绪配方，同时成为酒馆情绪档案的一部分，酒馆不再只是提供酒饮的空间，而是一处允许人们观察、表达并重新调配自身情绪的实验场所。"]},
      {title: "Interaction Flow｜互动流程", steps: [
        {label: "情绪采样", text: "消费者先选择自己当下的主要情绪，例如喜悦、悲伤、愤怒、恐惧、惊讶和厌恶，再用刻度调节情绪强度。"},
        {label: "情绪混合", text: "人的情绪通常不是单一的，因此消费者可以同时选择两到三种情绪，例如“70%期待＋20%紧张＋10%疲惫”。"},
        {label: "味觉转译", bullets: ["甜度代表愉悦与安全感", "酸度代表敏感与紧张", "苦味代表压抑与疲惫", "辛辣代表愤怒与冲动", "气泡代表兴奋与不确定", "酒液颜色对应情绪组合"]},
        {label: "选择情绪方向", text: "消费者可以填写“我现在的情绪”和“我希望抵达的状态”，酒饮的前调表现当下情绪，后调逐渐转向期待的状态，让喝酒的过程也成为一次情绪变化。"},
        {label: "生成专属配方", text: "系统为每杯酒生成独一无二的名字、颜色、配方和“情绪标签”，例如：62%疲惫＋23%期待＋15%不安。"},
        {label: "形成情绪档案", text: "每位消费者完成的酒饮都会变成一只虚拟样本瓶，留在酒馆的情绪档案墙中。"}
      ]}
    ]
  },
  walk: { title: "出门走走系列", kicker: "RED CLUB", role: "Visual Designer", year: "2026", image: "./assets/works-walk.jpg", alt: "户外风景占位图片", description: "小红书 REDclub 出门走走系列。负责直播间场景搭建与贴片视觉设计，在品牌规范下完成整套视觉延展。当前图片为临时占位，正式项目图与说明将陆续更新。" },
  mashangkaichang: {
    title: "《马上开场》", kicker: "AIGC CAMPAIGN / MOTION", year: "2026", tools: "ChatGPT、即梦、可灵、海螺",
    image: "./assets/mashangkaichang/cover.jpg", alt: "《马上开场》春节档系列宣传动态画面", video: "./assets/mashangkaichang/full.mp4",
    description: "《马上开场》是小红书电影为2026年春节档六部影片开展的系列宣传活动。在团队既定的主视觉与版式框架下，我运用 AI 生成电影主题小戳及六张宣传海报底图，并制作连接海报的五段转场动态。设计以水墨风格贯穿不同影片，将各自的主题元素与故事氛围融入统一的活动视觉，形成从静态海报到动态视频的连续表达。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["项目涵盖《飞驰人生3》《镖人：风起大漠》《惊蛰无声》《星河入梦》《熊出没：年年有熊》及《熊猫计划之部落奇遇记》六部春节档电影。六部影片在题材、场景与情绪氛围上各有特点，宣传视觉需要兼顾影片辨识度与活动整体的一致性。项目的设计重点，是在既定主视觉与版式框架内提炼每部电影的代表性元素，并将六张海报连贯地组织为动态内容。"]},
      {title: "Approach｜设计过程", paragraphs: ["从六部影片的主题元素与关键词出发，借助 ChatGPT 梳理影片关键信息，并结合即梦生成水墨风格的海报底图与电影主题小戳，通过对主体、场景及氛围的组织，使不同影片拥有各自的视觉特征，同时与整体风格相协调。动态部分使用可灵与海螺，为六张海报生成适配的五段转场动态，让不同电影场景在连续变化中展开，使静态水墨图像获得连续动态叙事。"]},
      {title: "Outcome｜项目成果", paragraphs: ["完成电影主题小戳、六张宣传海报底图及五段海报转场动态，为活动提供系列图像与动态衔接素材。作品将 AI 图像生成与视频生成结合，在团队既定视觉体系中呈现六部影片的不同氛围，并通过转场建立连贯的系列宣传视频。"]}
    ]
  },
  memberRedpacket: {
    title: "《会员膨胀红包》", kicker: "MEMBERSHIP EXPERIENCE / MOTION", year: "2026", tools: "Figma、Adobe After Effects、ChatGPT、可灵",
    image: "./assets/member-redpacket/cover.jpg", alt: "《会员膨胀红包》SVIP 动态画面", video: "./assets/member-redpacket/full.mp4",
    description: "项目围绕 QQ 音乐收银台新增的“会员天数膨胀”玩法展开，以膨胀红包作为奖励载体，将会员权益转化为用户能够参与和感知的动态体验。设计从红包膨胀、天数揭晓，延伸至收银台奖励提醒与支付完成后的到账展示，通过连续的反馈强化获得感，吸引用户开通超级会员。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["产品侧希望在收银台引入会员天数膨胀玩法，通过动态弹窗提升超级会员的开通吸引力。设计需要让用户快速理解奖励规则，并感受到额外天数的价值。同时，弹窗只是短暂的触点，奖励信息还需要在关闭弹窗、选择会员档位及完成支付的过程中持续呈现，使前面的参与体验能够承接后续的开通决策。"]},
      {title: "Approach｜设计过程", paragraphs: ["选择用户熟悉的“红包”作为载体，降低玩法的理解成本，再通过“膨胀”传达奖励增加的过程：红包帮助用户看懂奖励，膨胀让用户感受到奖励。", "视觉设计围绕四个部分展开：标题提前告知可获得膨胀天数，建立奖励预期；红包主体采用中间收紧、四角鼓起的造型，以饱满的形态与金色材质呼应膨胀玩法；SVIP 标识明确奖励与超级会员的关联；背景光效与星星配合动态变化，强化奖励揭晓时的氛围。创作中使用 ChatGPT 辅助红包包体设计，并通过可灵生成红包膨胀动态。", "动画结束后，以数字滚动承接膨胀的节奏，并通过天数定格与前后对比，让用户确认可获得的奖励。关闭弹窗后，收银台 Banner 继续展示膨胀天数，提醒用户开通即可获得；支付完成页则展示奖励到账信息，串联“触发—确认—承接”的完整体验。"]},
      {title: "Outcome｜项目成果", paragraphs: ["上线后的业务数据显示，超级会员日开通人数增加约 750 人，日开通收入增加 1.6 万元，开通 ARPU 从 9 元提升至 9.66 元，首两月收入提升 1.9 万元／天，各项指标均呈现正向表现。"]}
    ]
  },
  starWelfare: {
    title: "《星动福利站》", kicker: "MEMBERSHIP EXPERIENCE / MOTION", year: "2026", tools: "Figma、Adobe After Effects",
    image: "./assets/star-welfare/cover.jpg", alt: "《星动福利站》下拉入口动态画面", video: "./assets/star-welfare/full.mp4",
    description: "《星动福利站》是 QQ 音乐会员福利入口的体验设计项目。新赛季星愿奖池加入 iPhone 17 Pro Max、iPad、AirPods 和尤克里里四款实物大奖，用户在“我的”Tab 下拉页面，即可通过入口动画进入活动。设计以“奖品循环掉落”为核心表现形式，在短暂的下拉过程中集中呈现新赛季大奖，让用户快速识别核心权益，并通过持续循环的动态反馈吸引用户下拉进入福利站。",
    sections: [
      {title: "Context｜项目背景", paragraphs: ["星动福利站开启新赛季后，需要通过“我的”Tab 下拉入口向用户传达奖池更新。这个点位展示时间短，且奖品、会员权益与活动信息较多，用户很难在一次下拉中同时识别所有内容。因此，设计需要在有限空间和时间内突出视觉重点，让用户能够一眼识别核心大奖，从而吸引用户参与活动。"]},
      {title: "Approach｜设计过程", paragraphs: ["图形设计减少了实物的复杂细节，保留 iPhone、礼盒、尤克里里、AirPods 及会员权益等关键特征，以统一的色彩、圆润造型和轻量质感形成简洁的图标体系。在画面层级上放大礼盒与 iPhone 17 Pro Max，将最具吸引力的大奖设置为第一视觉重点，其余奖品则通过大小与位置变化形成循环节奏，让用户在下拉的短暂时间内直接识别核心权益。动画、奖品图形与文案共同完成“识别权益—触发下拉—引导进入”的体验路径。"]},
      {title: "Outcome｜项目成果", paragraphs: ["最终完成星动福利站新赛季的下拉入口视觉及循环动画，将多种实物奖品统一为简洁、易识别的图标语言，并通过奖品循环掉落、重点大奖放大及核心文案强化，让新赛季权益在短暂的下拉过程中被快速感知。"]}
    ]
  },
  afterimage: {
    title: "余像计划",
    kicker: "BRAND / EDITORIAL",
    role: "Visual Designer",
    year: "2026",
    image: "./assets/project-01.jpg",
    alt: "建筑墙面的光影构成",
    description: "以城市中不断变化的光线为观察对象，将影子的边缘、时间刻度与行走路径转化为视觉识别语言。当前页面保留了完整项目叙事结构，可继续补充调研、标志推演、字体系统与落地物料。"
  },
  tide: {
    title: "潮汐档案",
    kicker: "CAMPAIGN / TYPOGRAPHY",
    role: "Art Director",
    year: "2025",
    image: "./assets/project-03.jpg",
    alt: "混凝土建筑中的强烈光影",
    description: "围绕时间、潮汐与记忆建立动态传播概念。通过可伸缩的网格、重复字形和明暗节奏连接平面海报与屏幕媒介，形成一套可以持续生长的展览视觉系统。"
  },
  echo: {
    title: "回声花园",
    kicker: "INSTALLATION / SPACE",
    role: "Spatial Designer",
    year: "2025",
    image: "./assets/project-02.jpg",
    alt: "悬挂在展厅中的几何艺术装置",
    description: "将地方故事拆解为声音、色彩与可触发的空间节点，观众在移动中重新组合叙事。详情页可替换为场地分析、装置结构、交互流程与现场照片。"
  }
};

// Replace poster/preview with the supplied project media; never autoplay an unrelated asset.
const motionProjects = [
  {key:"jingjingyu", poster:"./assets/jingjingyu/preview-poster.jpg?v=chapter2-15-17", preview:"./assets/jingjingyu/preview.mp4?v=chapter2-15-17", lines:["《寂鲸语》以座头鲸之歌与船舶噪声为线索", "通过声音可视化，将两种声音转译为动态图形", "在四段动画中呈现它们的碰撞与交织", "探索工业化背景下海洋噪声与生命的关系"]},
  {key:"lou", poster:"./assets/lou/cover.jpg", preview:"./assets/lou/preview.mp4", lines:["《楼》以不断生长、层叠的楼房为意象", "将城市空间的变化与个人压力的累积相联", "通过“迷、复、抑、淡”四个阶段", "探讨快速城市化进程中人的生活与心理状态"]},
  {key:"liangyou", poster:"./assets/liangyou/cover.jpg", preview:"./assets/liangyou/preview.mp4?v=33-35", lines:["《良酉酒馆》是一处以情绪为灵感的虚拟酒馆", "将情绪转化为不同的果汁酒饮", "以实验室式的场景呈现情绪的调配与探索", "构想更具个性化的饮酒体验"]},
  {key:"mashangkaichang", poster:"./assets/mashangkaichang/cover.jpg", preview:"./assets/mashangkaichang/preview.mp4", lines:["奔马向前，佳片就位", "水墨晕染间电影世界依次浮现", "跟着流动的笔墨穿梭于不同的故事", "2026 春节档，好戏《马上开场》"]},
  {key:"memberRedpacket", poster:"./assets/member-redpacket/cover.jpg", preview:"./assets/member-redpacket/preview.mp4", lines:["简单直观的“膨胀红包”红包玩法", "可以让用户快速理解奖励机制", "该玩法通过连续的反馈强化获得感", "进而吸引用户开通超级会员"]},
  {key:"starWelfare", poster:"./assets/star-welfare/cover.jpg", preview:"./assets/star-welfare/preview.mp4", lines:["星动福利站开启了新的赛季", "上新四款实物大奖", "入口动画突出核心权益", "吸引用户下拉进入福利站参与活动"]}
].map(item => ({poster:null, preview:null, ...item}));

const numberPatterns = [
  ["00100","01100","10100","00100","00100","00100","00100","00100","11111"],
  ["11111","00001","00001","00001","11111","10000","10000","10000","11111"],
  ["11111","00001","00001","00001","11111","00001","00001","00001","11111"],
  ["10001","10001","10001","10001","11111","00001","00001","00001","00001"],
  ["11111","10000","10000","10000","11111","00001","00001","00001","11111"],
  ["11111","10000","10000","10000","11111","10001","10001","10001","11111"]
];
const projectList = document.querySelector("#motion-projects");
if (projectList) motionProjects.forEach((item, index) => {
  const row = document.createElement("article");
  row.className = `motion-row tone-${index % 3}`;
  let dotIndex = 0;
  const dots = numberPatterns[index].flatMap((line,y) => [...line].flatMap((dot,x) => dot === "1" ? [`<ellipse style="--dot-index:${dotIndex++}" cx="${16+x*30}" cy="${10+y*19}" rx="12" ry="7.6"/>`] : [])).join("");
  row.style.setProperty('--row-index', index);
  row.addEventListener('animationend', event => {
    if (event.target === row && event.animationName === 'work-row-in') row.classList.remove('is-entering');
  });
  row.innerHTML = `<svg class="bead-number" viewBox="0 0 152 174" aria-hidden="true">${dots}</svg><a class="motion-card" href="#project-${item.key}"><div class="motion-media"><span class="media-pending">主视觉待提供</span></div><div class="motion-copy">${item.lines.map((line,i)=>i===0?`<h2>${line}</h2>`:`<p>${line}</p>`).join("")}</div></a>`;
  const media = row.querySelector('.motion-media');
  if (item.poster) {
    media.replaceChildren();
    const poster = document.createElement('img');
    poster.src=item.poster; poster.alt=item.lines[0]; poster.loading='lazy'; media.append(poster);
  }
  if (item.preview) {
    const video = document.createElement('video');
    video.src=item.preview; video.muted=true; video.playsInline=true; video.preload='none';
    video.setAttribute('aria-hidden','true'); media.append(video);
    let timer, run=0, active=false;
    const stop = () => { active=false; run++; clearTimeout(timer); video.pause(); video.currentTime=0; media.classList.remove('is-playing'); };
    const start = async () => {
      if(active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      active=true; const attempt=++run;
      video.currentTime=0;
      try { await video.play(); } catch (_) { if(attempt===run) stop(); return; }
      if(attempt!==run) { if(!active) video.pause(); return; }
      media.classList.add('is-playing');
      timer=setTimeout(()=>video.pause(),2000);
    };
    const card=row.querySelector('a');
    card.addEventListener('pointerenter',start); card.addEventListener('pointerleave',stop);
    card.addEventListener('focus',start); card.addEventListener('blur',stop);
    video.addEventListener('timeupdate',()=>{if(video.currentTime>=2)video.pause();});
    video.addEventListener('error',stop);
    window.addEventListener('hashchange',stop);
    window.addEventListener('navigationrestart',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  }
  projectList.append(row);
});

const defaultDetailNotes = document.querySelector('.detail-notes').innerHTML;
function fillProject(key) {
  const project = projects[key] || projects.afterimage;
  document.querySelector("#project-detail-title").textContent = project.title;
  document.querySelector("#detail-kicker").textContent = project.kicker;
  document.querySelector("#detail-role").textContent = project.role || "";
  document.querySelector("#detail-role").parentElement.hidden = !!project.video;
  document.querySelector("#detail-year").previousElementSibling.textContent = project.video ? "YEAR｜创作年份" : "YEAR";
  document.querySelector("#detail-tools").textContent = project.tools || "";
  document.querySelector("#detail-tools").parentElement.hidden = !project.tools;
  document.querySelector("#detail-status").hidden = !!project.video;
  document.querySelector("#detail-year").textContent = project.year;
  document.querySelector("#detail-description").textContent = project.description;
  const image = document.querySelector("#detail-image");
  image.hidden = !project.image;
  if(project.image) image.src = project.image;
  else image.removeAttribute('src');
  image.alt = project.alt;
  image.hidden = !!project.video || !project.image;
  const hero = document.querySelector('.detail-hero');
  hero.querySelector('video')?.remove();
  hero.classList.toggle('has-video',!!project.video);
  document.querySelector('.project-view').classList.toggle('has-chapters',!!project.chapters);
  document.querySelector('.project-view').classList.toggle('has-sections',!!project.sections);
  if(project.video) {
    const video=createProjectVideo(project.videoSequence || project.video,project.image,`${project.title}概念视频`);
    hero.append(video);
  }
  document.querySelector('.detail-body > h2').textContent=project.sections ? 'Project Overview｜项目概述' : 'Project Overview';
  const notes=document.querySelector('.detail-notes');
  notes.innerHTML=defaultDetailNotes;
  if(project.sections) {
    notes.replaceChildren();
    project.sections.forEach((section,index)=>{
      const article=document.createElement('article');
      const number=document.createElement('span'); number.textContent=String(index+1).padStart(2,'0'); article.append(number);
      const heading=document.createElement('h3'); heading.textContent=section.title; article.append(heading);
      section.paragraphs?.forEach(text=>{const paragraph=document.createElement('p');paragraph.textContent=text;article.append(paragraph);});
      if(section.steps) {
        const list=document.createElement('ol'); list.className='interaction-steps';
        section.steps.forEach(step=>{
          const item=document.createElement('li');
          const copy=document.createElement('p');
          const label=document.createElement('strong'); label.textContent=`${step.label}：`;
          copy.append(label,document.createTextNode(step.text || '')); item.append(copy);
          if(step.bullets) {
            const bullets=document.createElement('ul');
            step.bullets.forEach(text=>{const bullet=document.createElement('li');bullet.textContent=text;bullets.append(bullet);});
            item.append(bullets);
          }
          list.append(item);
        });
        article.append(list);
      }
      notes.append(article);
    });
  }
  const chapters=document.querySelector('#detail-chapters');
  chapters.replaceChildren(); chapters.hidden=!project.chapters;
  project.chapters?.forEach(chapter=>{
    const section=document.createElement('section');section.className='chapter-video';
    const heading=document.createElement('h2');heading.textContent=chapter.title;
    section.append(heading,createProjectVideo(chapter.video,chapter.poster,`${project.title}${chapter.title}动态视频`));
    chapters.append(section);
  });
  const projectIndex = motionProjects.findIndex(item => item.key === key);
  const pager = document.querySelector('.project-pager');
  pager.hidden = projectIndex < 0;
  if (projectIndex >= 0) {
    const previous = motionProjects[(projectIndex + motionProjects.length - 1) % motionProjects.length];
    const next = motionProjects[(projectIndex + 1) % motionProjects.length];
    const previousLink = pager.querySelector('[data-previous-project]');
    const nextLink = pager.querySelector('[data-next-project]');
    previousLink.href = `#project-${previous.key}`;
    nextLink.href = `#project-${next.key}`;
  }
}

function createProjectVideo(src,poster,label) {
  const video=document.createElement('video');
  const sources=Array.isArray(src)?src:[src];
  let sourceIndex=0;
  video.src=sources[0];video.poster=poster;video.controls=true;video.playsInline=true;video.preload='none';
  video.setAttribute('aria-label',label);
  if(sources.length>1) video.addEventListener('ended',()=>{
    if(sourceIndex>=sources.length-1)return;
    sourceIndex+=1;video.src=sources[sourceIndex];video.load();video.play().catch(()=>{});
  });
  video.addEventListener('play',()=>document.querySelectorAll('.project-view video').forEach(other=>{if(other!==video)other.pause();}));
  return video;
}

let worksObserver;
document.querySelector('[data-previous-project]').addEventListener('click', () => { document.body.dataset.projectDirection = 'previous'; });
document.querySelector('[data-next-project]').addEventListener('click', () => { document.body.dataset.projectDirection = 'next'; });
function setRoute({ restart = false } = {}) {
  closeWechat(false);
  document.querySelectorAll('.project-view video').forEach(video=>video.pause());
  const hash = location.hash.slice(1) || "home";
  const isProject = hash.startsWith("project-");
  const route = isProject ? "project" : ["home", "works", "about"].includes(hash) ? hash : "home";
  const previousRoute = document.body.dataset.previousRoute;
  const enteringWorks = route === "works" && (restart || previousRoute !== "works");
  document.body.dataset.previousRoute = route;
  if (isProject) fillProject(hash.replace("project-", ""));
  if (restart || (isProject && previousRoute === "project")) {
    window.dispatchEvent(new Event("navigationrestart"));
    const currentView = views.find(view => view.dataset.view === route);
    currentView.classList.remove("is-active");
    void currentView.offsetWidth;
  }

  views.forEach((view) => {
    const active = view.dataset.view === route;
    view.classList.toggle("is-active", active);
    view.hidden = !active;
  });

  const navRoute = isProject ? "works" : route;
  links.forEach((link) => {
    const active = link.dataset.route === navRoute;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.body.classList.toggle("is-project-open", isProject);
  document.body.classList.toggle("is-home", route === "home");
  document.body.classList.toggle("is-works", route === "works");
  document.body.classList.toggle("is-about", route === "about");
  const showTalkOnEntry = route === "works" || isProject;
  worksTalk.classList.toggle("is-visible", showTalkOnEntry);
  worksTalk.setAttribute("aria-hidden", String(!showTalkOnEntry));
  worksTalkLastY = 0;
  const workRows = document.querySelectorAll(".motion-row");
  if (enteringWorks && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    worksObserver?.disconnect();
    workRows.forEach(row => { row.classList.remove("is-entering"); row.classList.add("is-waiting"); });
    void projectList.offsetWidth;
    worksObserver = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty('--entry-delay', `${index * 100}ms`);
        entry.target.classList.remove('is-waiting');
        entry.target.classList.add('is-entering');
        worksObserver.unobserve(entry.target);
      });
    }, { threshold: .08 });
    requestAnimationFrame(() => {
      if (document.body.classList.contains('is-works')) workRows.forEach(row => worksObserver.observe(row));
    });
  } else if (route !== "works") {
    worksObserver?.disconnect();
    workRows.forEach(row => row.classList.remove("is-entering", "is-waiting"));
  }
  const titles = { home: "Luna — Portfolio", works: "Works — Luna", about: "About — Luna", project: `${document.querySelector("#project-detail-title").textContent} — Luna` };
  document.title = titles[route];
  window.scrollTo({ top: 0, behavior: "instant" });
  if (route === "about") document.querySelector(".about-scroll").scrollTo({ top: 0, behavior: "instant" });
  requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("curtainroutechange", { detail: { restart } })));
}

links.forEach(link => link.addEventListener("click", event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const current = location.hash.slice(1) || "home";
  if (current !== link.dataset.route) return;
  event.preventDefault();
  setRoute({ restart: true });
}));

document.querySelectorAll("[data-project]").forEach((card) => {
  const open = () => { location.hash = `project-${card.dataset.project}`; };
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

window.addEventListener("hashchange", setRoute);
setRoute();

function updateWorksTalk() {
  worksTalkFrame = 0;
  const currentY = window.scrollY;
  const supportsTalk = document.body.classList.contains("is-works") || document.body.classList.contains("is-project-open");
  if (!supportsTalk) {
    worksTalk.classList.remove("is-visible");
    worksTalk.setAttribute("aria-hidden", "true");
  } else if (currentY < worksTalkLastY - 2) {
    worksTalk.classList.add("is-visible");
    worksTalk.setAttribute("aria-hidden", "false");
  } else if (currentY > worksTalkLastY + 2) {
    worksTalk.classList.remove("is-visible");
    worksTalk.setAttribute("aria-hidden", "true");
  }
  worksTalkLastY = currentY;
}
window.addEventListener("scroll", () => {
  if (!worksTalkFrame) worksTalkFrame = requestAnimationFrame(updateWorksTalk);
}, { passive: true });

// Frame-rate-independent wheel easing; touch and keyboard keep native scrolling.
function initInertialScroll() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(hover: hover) and (pointer: fine)');
  let surface = null, target = 0, position = 0, written = 0, frame = 0, lastTime = 0, direction = 0;
  const read = () => surface === window ? window.scrollY : surface.scrollTop;
  const limit = () => surface === window
    ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    : Math.max(0, surface.scrollHeight - surface.clientHeight);
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    surface = null;
    direction = 0;
  }
  function tick(time) {
    // A scrollbar drag or another native scroll takes priority over easing.
    if (Math.abs(read() - written) > 3) { stop(); return; }
    target = Math.max(0, Math.min(limit(), target));
    const dt = Math.min(64, time - lastTime);
    lastTime = time;
    position += (target - position) * (1 - Math.exp(-dt / 135));
    const done = Math.abs(target - position) < .4;
    if (done) position = target;
    surface.scrollTo({ top: position, behavior: 'instant' });
    written = read();
    if (done) { stop(); return; }
    frame = requestAnimationFrame(tick);
  }
  window.addEventListener('wheel', event => {
    if (reduced.matches || !desktop.matches || event.defaultPrevented || !event.cancelable ||
        event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        !event.deltaY || document.body.classList.contains('is-home') || document.body.classList.contains('wechat-open') ||
        event.target.closest('video, input, textarea, select, [contenteditable="true"]')) return;
    const about = document.querySelector('.about-scroll');
    const nextSurface = document.body.classList.contains('is-about') &&
      /auto|scroll/.test(getComputedStyle(about).overflowY) ? about : window;
    if (surface !== nextSurface) {
      stop();
      surface = nextSurface;
      target = position = written = read();
    }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    const nextDirection = Math.sign(delta);
    if (direction && nextDirection !== direction) target = position = read();
    direction = nextDirection;
    const nextTarget = Math.max(0, Math.min(limit(), target + delta));
    if (!frame && nextTarget === read()) { stop(); return; }
    event.preventDefault();
    target = nextTarget;
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
  }, { passive: false });
  ['hashchange', 'navigationrestart', 'resize', 'pointerdown', 'touchstart'].forEach(name =>
    window.addEventListener(name, stop, { passive: true }));
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'].includes(event.key)) stop();
  });
  reduced.addEventListener('change', stop);
  desktop.addEventListener('change', stop);
}
initInertialScroll();

// Use a native SVG cursor so the bead stays directly under the pointer.
function initBeadCursor() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let x = -1, y = -1, pending = false;
  function refresh() {
    pending = false;
    let tone = 'pink';
    if (finePointer.matches && x >= 0) {
      let element = document.elementFromPoint(x, y);
      while (element) {
        const color = getComputedStyle(element).backgroundColor;
        const channels = color.match(/[\d.]+/g)?.map(Number);
        if (channels && channels.length >= 3 && (channels.length < 4 || channels[3] > .1)) {
          const [red, green, blue] = channels;
          if (red > 180 && blue > 110 && green < red * .8) tone = 'yellow';
          break;
        }
        element = element.parentElement;
      }
    }
    if (document.documentElement.dataset.cursorTone !== tone) document.documentElement.dataset.cursorTone = tone;
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(refresh); } }
  document.addEventListener('pointermove', event => { x = event.clientX; y = event.clientY; schedule(); }, { passive: true });
  document.addEventListener('scroll', schedule, { capture: true, passive: true });
  window.addEventListener('curtainroutechange', schedule);
  finePointer.addEventListener('change', schedule);
}
initBeadCursor();

function initCanvas(selector, mode = "home") {
  const canvas = document.querySelector(selector);
  if (!canvas) return;
  const isWorks = mode === "works";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const context = canvas.getContext("2d");
  if (!context) return;
  const fallback = document.querySelector(isWorks ? ".works-curtain-fallback" : ".home-curtain-fallback");
  const pointer = { x: -1000, y: -1000, px: -1000, py: -1000, active: false };
  const groups = [];
  const palette = isWorks
    ? { cord: "#ffa0fe", blue: "#fff74e", yellow: "#06b4ff", pink: "#ffa0fe", lettering: "#752701" }
    : { cord: "#e9fb5b", blue: "#ff6ccd", yellow: "#e9fb5b", pink: "#8e4806", lettering: "#003f2c" };
  const glyphs = {
    // Eight-row lettering follows the smaller, two-bead strokes in the reference.
    W: ["110011","110011","110011","111111","111111","111111","111111","110011"],
    E: ["111111","111111","110000","111110","111110","110000","111111","111111"],
    L: ["110000","110000","110000","110000","110000","110000","111111","111111"],
    C: ["011111","111111","110000","110000","110000","110000","111111","011111"],
    O: ["011110","111111","110011","110011","110011","110011","111111","011110"],
    M: ["110011","111111","111111","111111","111111","110011","110011","110011"],
    I: ["111111","111111","001100","001100","001100","001100","111111","111111"],
    N: ["110011","111011","111011","111111","111111","110111","110111","110011"],
    T: ["111111","111111","001100","001100","001100","001100","001100","001100"],
    S: ["011111","111111","110000","111110","011111","000011","111111","111110"],
    K: ["110011","110110","111100","111000","111000","111100","110110","110011"],
    R: ["111110","111111","110011","111111","111110","111100","110110","110011"],
    G: ["011111","111111","110000","110000","110111","110011","111111","011110"],
    H: ["110011","110011","110011","111111","111111","110011","110011","110011"],
    "'": ["11","11","10","00","00","00","00","00"],
    " ": Array(8).fill("00")
  };
  let lineWidth = 1.3;
  let beadWidth = 10;
  let beadHeight = 6;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  let lastTime = 0;
  let strandPitch = 0;
  let navAnchors = [];
  let revealLeft = 0;
  let revealTop = 0;
  const revealText = !isWorks ? document.createElement("canvas") : null;
  let revealOpacity = 0;
  let revealOpen = false;
  let entranceStart = -Infinity;
  let homeWasActive = false;
  let homeEntries = 0;

  function syncEntrance(restart = false) {
    const active = document.querySelector(`[data-view="${mode}"]`).classList.contains("is-active");
    if (!isWorks && active && (!homeWasActive || restart)) {
      homeEntries++;
      if (!reducedMotion) entranceStart = performance.now();
      const message = homeEntries % 2 === 0 ? "LET’S WORK TOGETHER" : "WELCOME IN";
      canvas.setAttribute("aria-label", message);
      document.querySelector("#home-title").textContent = `${message} — Luna 的个人作品集`;
      if (fallback?.querySelector("span")) fallback.querySelector("span").textContent = message;
    }
    homeWasActive = active;
  }

  function messageCenterY() {
    return ((width <= 768 ? 58 : 84) + height - 8) / 2;
  }

  function prepareReveal() {
    if (isWorks || !width) return;
    const maxWidth = Math.min(640, width - 28);
    const lines = [
      { text: "欢迎来到Luna的空间", color: "#ff6ccd" },
      { text: "这里收录了Luna的所有动态作品", color: "#ff6ccd" },
      { text: "如果你愿意多停一会儿", color: "#ff6ccd" },
      { text: "也许会发现一些共鸣", color: "#ff6ccd" }
    ];
    const probe = revealText.getContext("2d");
    probe.font = '400 18px "Source Han Sans SC", sans-serif';
    const rows = [];
    lines.forEach((line) => {
      let row = "";
      for (const char of line.text) {
        if (row && probe.measureText(row + char).width > maxWidth - 8) {
          rows.push({ text: row, color: line.color }); row = "";
        }
        row += char;
      }
      rows.push({ text: row, color: line.color });
    });
    const lineHeight = 18 * 2.58;
    const textHeight = rows.length * lineHeight;
    revealLeft = (width - maxWidth) / 2;
    revealTop = messageCenterY() - textHeight / 2;
    revealText.width = Math.ceil(maxWidth * ratio);
    revealText.height = Math.ceil(textHeight * ratio);
    const ink = revealText.getContext("2d");
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    ink.font = '400 18px "Source Han Sans SC", sans-serif';
    ink.textBaseline = "middle";
    rows.forEach((row, i) => {
      let x = (maxWidth - ink.measureText(row.text).width) / 2;
      for (const char of row.text) {
        ink.fillStyle = row.color;
        ink.fillText(char, x, lineHeight / 2 + i * lineHeight);
        x += ink.measureText(char).width;
      }
    });
  }

  function drawReveal() {
    if (!revealText.width || !groups.length || revealOpacity === 0) return;
    context.save();
    context.globalAlpha = revealOpacity;
    context.drawImage(revealText, revealLeft, revealTop, revealText.width / ratio, revealText.height / ratio);
    context.restore();
  }

  function updateReveal(milliseconds) {
    if (isWorks || !groups.length) return;
    if (groups.some(group => group.dropping)) {
      const coverage = groups.reduce((sum, group) => sum + group.deployment, 0) / groups.length;
      const target = 1 - Math.min(1, Math.max(0, (coverage - .65) / .3));
      revealOpacity += (target - revealOpacity) * (1 - Math.exp(-milliseconds / 160));
      revealOpen = target > .5;
      return;
    }
    const halfRegion = Math.min(210, width * .27);
    let displacement = 0;
    let count = 0;
    for (const group of groups) {
      if (Math.abs(group.baseX - width / 2) > halfRegion) continue;
      const point = beadPosition(group, (messageCenterY() - group.pinY) / group.restSegment);
      displacement += Math.hypot(point.x - group.baseX, point.y - messageCenterY());
      count += 1;
    }
    // The whole sentence fades together, driven by the central curtain's
    // physical displacement, never by pointer presence or a text-shaped mask.
    const opening = displacement / Math.max(1, count);
    if (opening > strandPitch * 2.6) revealOpen = true;
    else if (opening < strandPitch * 1.2) revealOpen = false;
    const target = revealOpen ? 1 : 0;
    revealOpacity += (target - revealOpacity) * (1 - Math.exp(-milliseconds / (revealOpen ? 180 : 240)));
    if (Math.abs(target - revealOpacity) < .001) revealOpacity = target;
  }

  function makeRope(spec, index) {
    const count = 32;
    // Header top 12px + 29px line box + 16px clear gap to bead edge.
    const anchorY = isWorks ? 8 : 57 + strandPitch * .42 * 39 / 62;
    const endY = isWorks ? height - 8 : height - 20 - strandPitch * .42 * 39 / 62;
    const x = width * spec.x;
    const points = Array.from({ length: count }, (_, pointIndex) => {
      const y = anchorY + (endY - anchorY) * pointIndex / (count - 1);
      return { x, y, vx: 0, vy: 0, oldX: x, oldY: y };
    });
    return { baseX: x, anchorY, segment: (endY - anchorY) / (count - 1), points, beads: [], letters: [] };
  }

  function stringBeads() {
    const pitch = strandPitch;
    beadWidth = pitch * .42;
    beadHeight = beadWidth * 39 / 62;
    const rowGap = beadHeight * 2 + pitch * .1;
    const add = (group, y, color, size = 1) => group.beads.push({
      position: (y - group.anchorY) / group.segment, color, size
    });
    if (isWorks) {
      groups.forEach((group, index) => {
        const color = index % 6 === 0 ? palette.yellow : palette.pink;
        add(group, group.anchorY, color);
        add(group, height - 8, color);
      });
      const fontSize = Math.max(14, Math.min(18, pitch * .78));
      const labelSpecs = [
        [2, "出门走走系列", .23], [6, "马年春节档电影", .48],
        [10, "赵露思微综艺", .33], [15, "小红书喜剧厂牌", .42]
      ];
      labelSpecs.forEach(([strand, label, start]) => {
        const group = groups[strand];
        const step = Math.min(fontSize * 1.65, height * .032);
        [...label].forEach((character, row) => group.letters.push({
          character, size: fontSize,
          position: (height * start + row * step - group.anchorY) / group.segment
        }));
      });
      return;
    }
    const word = (label, centerY) => {
      // One empty strand between letters and four between the two words.
      const columns = [...label].reduce((sum, letter) => sum + glyphs[letter][0].length + 1, -1);
      let column = Math.floor((groups.length - columns) / 2);
      for (const letter of label) {
        const glyph = glyphs[letter];
        glyph.forEach((row, y) => [...row].forEach((pixel, x) => {
          if (pixel === "1") add(groups[column + x], centerY + (y - (glyph.length - 1) / 2) * rowGap, palette.lettering);
        }));
        column += glyph[0].length + 1;
      }
    };
    if (homeEntries % 2 === 0 && homeEntries > 0) {
      word("LET'S WORK", messageCenterY() - rowGap * 5.5);
      word("TOGETHER", messageCenterY() + rowGap * 5.5);
    } else {
      word("WELCOME IN", messageCenterY());
    }
    // Two-row top trim and three-row bottom trim from the approved composition.
    groups.forEach((group, index) => {
      index -= (groups.length - 69) / 2;
      index = ((index % 12) + 12) % 12;
      const top = group.anchorY;
      const bottom = height - 20 - beadHeight;
      add(group, top, index % 6 === 1 ? palette.blue : palette.yellow);
      if (index % 6 >= 3) add(group, top + rowGap, palette.pink);
      const distance = Math.abs(((index - 4 + 6) % 12 + 12) % 12 - 6);
      if (distance <= 1) add(group, bottom - 2 * rowGap, palette.yellow);
      if (distance <= 2) add(group, bottom - rowGap, palette.pink);
      add(group, bottom, index % 12 === 0 || index % 12 === 8 ? palette.blue : palette.yellow);
    });
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = Math.max(1, bounds.height);
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    groups.length = 0;
    revealOpacity = 0;
    revealOpen = false;

    lineWidth = isWorks ? (width < 720 ? .6 : .8) : 2;
    // Keep the existing bead scale, removing one outer strand on each side.
    strandPitch = isWorks ? width * .84 / 18 : width * .94 / 68;
    const strandCount = isWorks ? 19 : 71;
    for (let index = 0; index < strandCount; index += 1) {
      const x = isWorks ? .08 + index / (strandCount - 1) * .84 : .5 + (index - (strandCount - 1) / 2) * strandPitch / width;
      groups.push(makeRope({ x }, index));
    }
    stringBeads();
    if (!isWorks) groups.forEach((group, column) => {
      const endY = group.points.at(-1).y;
      const originalSegment = group.segment;
      group.pinY = group.anchorY + beadHeight * 2 + strandPitch * .1;
      group.restSegment = (endY - group.pinY) / (group.points.length - 1);
      group.beads.forEach(bead => {
        const y = group.anchorY + bead.position * originalSegment;
        bead.fixedY = y <= group.pinY + .1 ? y : null;
        bead.position = (y - group.pinY) / group.restSegment;
        bead.restPosition = bead.position;
      });
      group.movingBeads = group.beads.filter(bead => bead.fixedY === null).sort((a, b) => a.restPosition - b.restPosition);
      const entering = !reducedMotion && performance.now() - entranceStart < 150;
      const variation = salt => {
        const value = Math.sin((column + 1) * 127.1 + salt * 311.7) * 43758.5453;
        return value - Math.floor(value);
      };
      group.deployment = entering ? .24 + .012 * Math.sin(column * 1.7) : 1;
      const packedLength = group.movingBeads.length * beadHeight * 2.08;
      group.deployment = Math.max(group.deployment, packedLength / (endY - group.pinY));
      group.initialDeployment = group.deployment;
      group.dropVelocity = 0;
      group.dropWait = 24 + variation(1) * 40;
      group.dropGravity = .00022 + variation(2) * .00068;
      group.restitution = .22 + variation(3) * .2;
      group.swingDirection = variation(4) < .5 ? -1 : 1;
      group.swingStrength = .9 + variation(5) * 1.7;
      group.windPhase = variation(6) * Math.PI * 2;
      group.windRate = .75 + variation(7) * .55;
      group.dropping = entering;
      group.column = column;
      group.segment = group.restSegment * group.deployment;
      spaceHangingBeads(group);
      group.points.forEach((p, i) => {
        p.y = p.oldY = group.pinY + i * group.segment;
      });
    });
    // Navigation shares the actual strand centers, including after a resize.
    if (!isWorks) {
    navAnchors = [];
    const navLinks = [...document.querySelectorAll(".site-nav .nav-link")];
    navLinks.forEach((link, index) => {
      const targetX = width * (.03 + index * .47);
      const candidates = groups;
      const nearest = candidates.reduce((best, group) => Math.abs(group.baseX - targetX) < Math.abs(best.baseX - targetX) ? group : best);
      link.style.setProperty("--strand-x", `${(bounds.left + nearest.baseX) / document.documentElement.clientWidth * 100}%`);
      navAnchors.push(nearest.baseX);
    });
    document.body.style.setProperty("--curtain-top", `${groups[0].anchorY}px`);
    document.body.style.setProperty("--home-nav-top", `${Math.max(20, height * .053 - 12)}px`);
    document.body.style.setProperty("--nav-bead-width", `${beadWidth * 2}px`);
    document.body.style.setProperty("--curtain-pitch", `${strandPitch}px`);
    prepareReveal();
    if (groups.some(group => group.dropping)) { revealOpacity = 1; revealOpen = true; }
    }
    context.clearRect(0, 0, width, height);
    drawScene();
    fallback?.classList.add("is-hidden");
  }

  function spaceHangingBeads(group) {
    // Gather every free bead at the hanging end before release, then unfold
    // the gaps progressively as the cord extends to its full length.
    const gap = beadHeight * 2.08;
    const length = group.segment * (group.points.length - 1);
    const progress = Math.max(0, Math.min(1,
      (group.deployment - group.initialDeployment) / Math.max(.001, 1 - group.initialDeployment)));
    const unfold = group.initialDeployment >= 1 ? 1 : progress * progress * (3 - 2 * progress);
    let nextDistance = length + gap;
    for (let i = group.movingBeads.length - 1; i >= 0; i--) {
      const bead = group.movingBeads[i];
      const packed = length - (group.movingBeads.length - 1 - i) * gap;
      const target = packed + (bead.restPosition * group.segment - packed) * unfold;
      const distance = Math.max((i + 1) * gap,
        Math.min(target, nextDistance - gap));
      bead.position = distance / group.segment;
      nextDistance = distance;
    }
  }

  function update(group, dt, motion) {
    const points = group.points;
    if (group.dropping) {
      group.dropWait -= dt;
      if (group.dropWait <= 0) {
        group.dropVelocity += group.dropGravity * dt;
        group.deployment += group.dropVelocity * dt;
        if (group.deployment >= 1) {
          group.deployment = 1;
          const impact = group.dropVelocity;
          group.dropVelocity = -impact * group.restitution;
          const kick = group.swingDirection * group.swingStrength * Math.min(2.4, impact * 95);
          points.forEach((p, i) => { p.vx += kick * i / (points.length - 1); });
          if (impact < .0018) { group.dropping = false; group.dropVelocity = 0; }
        }
        group.segment = group.restSegment * group.deployment;
        spaceHangingBeads(group);
      }
    }
    // A low, slowly varying breeze acts on the free rope, not its fixed anchor.
    // Adjacent strands share a wave with a small phase offset, avoiding jitter.
    const phase = isWorks ? 0 : group.windPhase;
    const seconds = lastTime / 1000;
    // Smoothly modulated phase and strength create gusts and quiet intervals.
    // No random per-frame forces: acceleration stays continuous on every strand.
    const windTime = seconds * .78 * (group.windRate || 1) + .55 * Math.sin(seconds * .19) + .2 * Math.sin(seconds * .37);
    const windStrength = .75 + .2 * Math.sin(seconds * .27) + .15 * Math.sin(seconds * .43 + 1.2);
    const breeze = isWorks ? 0 : .015 * windStrength * (Math.sin(windTime + phase) + .3 * Math.sin(windTime * 1.43 - phase));
    const radius = Math.max(group.segment * 1.6, Math.min(60, height * .065));
    const damping = Math.pow(.975, dt);
    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      p.oldX = p.x; p.oldY = p.y;
      p.x += p.vx * damping * dt + breeze * (i / (points.length - 1)) * dt * dt;
      p.y += (p.vy * damping + 1.05 * dt) * dt;
      if (pointer.active) {
        const dx = motion.x - motion.fromX, dy = motion.y - motion.fromY;
        const distance2 = dx * dx + dy * dy;
        const t = distance2 ? Math.max(0, Math.min(1,
          ((p.x - motion.fromX) * dx + (p.y - motion.fromY) * dy) / distance2)) : 1;
        const nx = p.x - (motion.fromX + dx * t), ny = p.y - (motion.fromY + dy * t);
        const distance = Math.hypot(nx, ny);
        if (distance < radius) {
          // A moving rounded contact carries the rope without attaching a node.
          // Nodes can slide around it, and the free end eventually slips off.
          const normalX = distance > .01 ? nx / distance : Math.sign(dx) || 1;
          const normalY = distance > .01 ? ny / distance : 0;
          p.x = motion.x + normalX * radius;
          p.y = motion.y + normalY * radius;
        }
      }
    }
    for (let pass = 0; pass < 18; pass += 1) {
      // Gentle bending resistance prevents tight curls at a released tip.
      if (pass % 3 === 0) {
        for (let i = 2; i < points.length; i += 1) {
          const a = points[i - 2], b = points[i];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.max(.001, Math.hypot(dx, dy));
          const correction = (distance - group.segment * 2) / distance * .18;
          if (i > 2) { a.x += dx * correction * .5; a.y += dy * correction * .5; }
          b.x -= dx * correction * (i === 2 ? 1 : .5);
          b.y -= dy * correction * (i === 2 ? 1 : .5);
        }
      }
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1], b = points[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.max(.001, Math.hypot(dx, dy));
        const correction = (distance - group.segment) / distance;
        const share = i === 1 ? 1 : .5;
        if (i > 1) { a.x += dx * correction * .5; a.y += dy * correction * .5; }
        b.x -= dx * correction * share; b.y -= dy * correction * share;
      }
      if (pointer.active) {
        for (let i = 1; i < points.length; i += 1) {
          const p = points[i];
          const dx = p.x - motion.x, dy = p.y - motion.y;
          const distance = Math.hypot(dx, dy);
          if (distance > .001 && distance < radius) {
            p.x = motion.x + dx / distance * radius;
            p.y = motion.y + dy / distance * radius;
          }
        }
      }
    }
    // Enforce the material length last: an unreachable cursor must let go,
    // rather than stretching the strand or holding its tip indefinitely.
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1], p = points[i];
      const dx = p.x - a.x, dy = p.y - a.y;
      const distance = Math.hypot(dx, dy);
      const solvedX = p.x, solvedY = p.y;
      p.x = a.x + (distance > .001 ? dx / distance : 0) * group.segment;
      p.y = a.y + (distance > .001 ? dy / distance : 1) * group.segment;
      // The length cleanup is positional; it must not inject extra kinetic energy.
      p.vx = Math.max(-12, Math.min(12, (solvedX - p.oldX) / dt));
      p.vy = Math.max(-12, Math.min(12, (solvedY - p.oldY) / dt));
    }
  }

  function drawCord(group) {
    context.save();
    context.beginPath();
    context.moveTo(group.baseX, group.anchorY);
    context.lineTo(group.points[0].x, group.points[0].y);
    for (let i = 1; i < group.points.length - 1; i += 1) {
      const point = group.points[i];
      const next = group.points[i + 1];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    }
    const last = group.points[group.points.length - 1];
    context.lineTo(last.x, last.y);
    context.strokeStyle = palette.cord;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.stroke();
    context.restore();
  }

  function beadPosition(group, position) {
    const points = group.points;
    const last = points.length - 1;
    if (position >= last - .5) {
      const a = points[last - 1], b = points[last];
      const t = Math.min(1, 1 - (last - position));
      return { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, angle: Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2 };
    }
    const i = Math.max(1, Math.min(last - 1, Math.floor(position + .5)));
    const a = i === 1 ? points[0] : { x: (points[i-1].x+points[i].x)/2, y: (points[i-1].y+points[i].y)/2 };
    const b = points[i], c = { x: (b.x+points[i+1].x)/2, y: (b.y+points[i+1].y)/2 };
    const t = i === 1 ? position / 1.5 : position - (i - .5);
    const u = 1-t;
    const dx = u*(b.x-a.x)+t*(c.x-b.x), dy = u*(b.y-a.y)+t*(c.y-b.y);
    return { x: u*u*a.x+2*u*t*b.x+t*t*c.x, y: u*u*a.y+2*u*t*b.y+t*t*c.y, angle: Math.atan2(dy,dx)-Math.PI/2 };
  }

  function drawBeads(group) {
    for (const bead of group.beads) {
      const p = !isWorks && bead.fixedY !== null ? { x: group.baseX, y: bead.fixedY, angle: 0 } : beadPosition(group, bead.position);
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.angle);
      context.beginPath();
      context.ellipse(0, 0, beadWidth * bead.size, beadHeight * bead.size, 0, 0, Math.PI*2);
      context.fillStyle = bead.color;
      context.fill();
      context.restore();
    }
  }

  function separateCords() {
    if (isWorks) return;
    // Keep each rope hanging down, so its path cannot fold into a loop.
    for (const group of groups) {
      for (let i = 1; i < group.points.length; i++) {
        const p = group.points[i], above = group.points[i - 1];
        if (p.y < above.y + group.segment * .35) {
          p.y = above.y + group.segment * .35;
          p.vy = Math.max(0, p.vy);
        }
      }
    }
    const sample = (group, y) => {
      const points = group.points;
      if (y > points.at(-1).y || y < points[0].y) return null;
      let i = 1;
      while (i < points.length - 1 && points[i].y < y) i++;
      const a = points[i - 1], b = points[i];
      const t = Math.max(0, Math.min(1, (y - a.y) / Math.max(.001, b.y - a.y)));
      return { x: a.x + (b.x - a.x) * t, a, b, t, fixedA: i === 1 };
    };
    const move = (hit, distance) => {
      const wa = hit.fixedA ? 0 : 1 - hit.t, wb = hit.t;
      const weight = wa * wa + wb * wb;
      if (weight < .001) return;
      for (const [p, w] of [[hit.a, wa], [hit.b, wb]]) {
        if (!w) continue;
        p.x += distance * w / weight;
        if (p.vx * distance < 0) p.vx *= .3;
      }
    };
    // Check both ropes' heights: adjacent strands can have different drop speeds.
    const gap = Math.max(lineWidth * 1.5, strandPitch * .28);
    for (let pass = 0; pass < 5; pass++) {
      for (let pair = 0; pair < groups.length - 1; pair++) {
        const j = pass % 2 ? groups.length - 2 - pair : pair;
        const left = groups[j], right = groups[j + 1];
        for (const point of [...left.points.slice(1), ...right.points.slice(1)]) {
          const a = sample(left, point.y), b = sample(right, point.y);
          if (!a || !b) continue;
          const overlap = a.x + gap - b.x;
          if (overlap > 0) { move(a, -overlap * .5); move(b, overlap * .5); }
        }
      }
    }
  }

  function collideBeads() {
    if (isWorks || reducedMotion) return;
    const cellW = beadWidth * 2, cellH = beadHeight * 2;
    const cells = new Map();
    for (const group of groups) for (const bead of group.beads) {
      if (bead.fixedY !== null) continue;
      const position = beadPosition(group, bead.position);
      const node = group.points[Math.max(1, Math.min(group.points.length - 1, Math.round(bead.position)))];
      const cx = Math.floor(position.x / cellW), cy = Math.floor(position.y / cellH);
      for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
        for (const other of cells.get(`${x},${y}`) || []) {
          if (other.group === group) continue;
          const dx = position.x - other.position.x, dy = position.y - other.position.y;
          const separation = Math.hypot(dx / cellW, dy / cellH);
          if (separation >= 1) continue;
          const length = Math.hypot(dx, dy) || .001;
          const nx = length > .001 ? dx / length : 1, ny = dy / length;
          const closing = (node.vx - other.node.vx) * nx + (node.vy - other.node.vy) * ny;
          const push = Math.min(1.5, (1 - separation) * beadHeight * .45);
          const impulse = Math.min(2, Math.max(0, -closing) * .6 + push * .25);
          node.x += nx * push; node.y += ny * push;
          other.node.x -= nx * push; other.node.y -= ny * push;
          node.vx += nx * impulse; node.vy += ny * impulse;
          other.node.vx -= nx * impulse; other.node.vy -= ny * impulse;
        }
      }
      const key = `${cx},${cy}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push({ group, node, position });
    }
  }

  function drawScene() {
    if (!isWorks && groups.length) {
      drawReveal();
    }
    groups.forEach(group => drawCord(group));
    groups.forEach(drawBeads);
    if (isWorks) groups.forEach((group) => group.letters.forEach((letter) => {
      const point = beadPosition(group, letter.position);
      context.save();
      context.translate(point.x, point.y);
      context.rotate(point.angle);
      context.fillStyle = "#fff";
      context.fillRect(-letter.size * .58, -letter.size * .72, letter.size * 1.16, letter.size * 1.44);
      context.fillStyle = palette.pink;
      context.font = `400 ${letter.size}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(letter.character, 0, 0);
      context.restore();
    }));
  }

  function animate(time) {
    frame = requestAnimationFrame(animate);
    const elapsed = lastTime ? Math.min(2, Math.max(.1, (time - lastTime) / (1000 / 60))) : 1;
    lastTime = time;
    if (!document.querySelector(`[data-view="${mode}"]`).classList.contains("is-active")) {
      pointer.active = false;
      return;
    }
    const motion = { x: pointer.x - pointer.px, y: pointer.y - pointer.py, elapsed };
    const steps = Math.min(12, Math.max(Math.ceil(elapsed * 2),
      pointer.active ? Math.ceil(Math.hypot(motion.x, motion.y) / 25) : 1));
    context.clearRect(0, 0, width, height);
    for (let step = 0; step < steps; step += 1) {
      const contact = {
        fromX: pointer.px + motion.x * step / steps,
        fromY: pointer.py + motion.y * step / steps,
        x: pointer.px + motion.x * (step + 1) / steps,
        y: pointer.py + motion.y * (step + 1) / steps
      };
      groups.forEach((group) => update(group, elapsed / steps, contact));
    }
    collideBeads();
    separateCords();
    updateReveal(elapsed * 1000 / 60);
    drawScene();
    fallback?.classList.add("is-hidden");
    pointer.px = pointer.x;
    pointer.py = pointer.y;
  }

  function updatePointer(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = clientX - bounds.left;
    pointer.y = clientY - bounds.top;
    if (!pointer.active) { pointer.px = pointer.x; pointer.py = pointer.y; }
    pointer.active = true;
  }

  canvas.addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY));
  canvas.addEventListener("pointerdown", (event) => {
    updatePointer(event.clientX, event.clientY);
  });
  canvas.addEventListener("pointerleave", () => { pointer.active = false; });
  canvas.addEventListener("pointercancel", () => { pointer.active = false; });
  canvas.addEventListener("pointerup", () => { pointer.active = false; });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("curtainroutechange", event => {
    syncEntrance(event.detail?.restart === true);
    if (document.querySelector(`[data-view="${mode}"]`).classList.contains("is-active")) resize();
  });
  window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
  syncEntrance();
  resize();
  if (!isWorks && document.fonts) {
    document.fonts.load('18px "Source Han Sans SC"').then(() => {
      if (!groups.length) return;
      prepareReveal();
      context.clearRect(0, 0, width, height);
      drawScene();
    });
  }
  if (reducedMotion) {
    drawScene();
    fallback?.classList.add("is-hidden");
    return;
  }
  frame = requestAnimationFrame(animate);
}

initCanvas("#home-canvas");
initCanvas("#works-canvas", "works");
