export type Language = 'th' | 'en';

export const translations = {
    th: {
        // Header
        appTitle: 'NamtanFilm × Levi’s 👖✨',
        featuredEngagementTitle: "บูส บูส NamtanFilm × Levi’s! 🚀",
        featuredEngagementToggle: 'บูสๆ 🚀',
        importantMediaTitle: 'สื่อและพาร์ตเนอร์แฟชั่น 🌟',
        importantMediaToggle: 'โฟกัสสื่อ',
        all: 'ทั้งหมด',
        hide: '✓ ซ่อน',
        show: '○ แสดง',

        // Loading
        loading: 'กำลังโหลดข้อมูล...',
        error: 'ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบ Google Sheet URL',

        // Stats
        pending: 'รอดำเนินการ',
        done: '✓ เสร็จสิ้น',
        progress: 'กำลังดำเนินการ',
        completed: 'เสร็จสมบูรณ์',

        // Task list
        tasks: 'ภารกิจทั้งหมด',
        noTitle: 'ไม่มีชื่อเรื่อง',
        scrollToLoad: 'เลื่อนเพื่อโหลดเพิ่ม...',
        noTasks: 'ยังไม่มีรายการ',
        missionCount: 'ภารกิจทั้งหมด',
        missionCountUnit: 'รายการ',
        noBoostPosts: 'ไม่มีโพสต์ที่ต้องบูส (ใส่ boost=x ในชีตก่อนนะ)',
        totalEngagementLabel: 'รวมทั้งหมด',
        allDone: 'ทำครบหมดแล้ว!',
        summary: 'สรุปยอด',
        globalStats: 'ยอดรวมทุกแพลตฟอร์ม',
        totalStats: 'ยอดรวมทั้งหมด',
        igStats: 'ยอดรวม IG ทั้งหมด',
        tiktokStats: 'ยอดรวม TikTok ทั้งหมด',
        xStats: 'ยอดรวม X ทั้งหมด',
        facebookStats: 'ยอดรวม Facebook ทั้งหมด',
        youtubeStats: 'ยอดรวม YouTube ทั้งหมด',
        missionImpact: 'Mission Impact สถิติรวม',
        completedTasks: 'งานที่ทำเสร็จแล้ว',
        updateData: 'อัปเดตข้อมูล',
        totalLabel: 'รวมทั้งสิ้น',

        // Modal
        hashtagsLabel: '📝 Hashtags ที่ต้องใช้:',
        noHashtags: 'ไม่มี Hashtags',
        copied: '✓ คัดลอกแล้ว!',
        copyText: '📋 คัดลอกข้อความ',
        goPost: '🚀 ไปโพสต์เลย!',
        markDone: '✓ ทำเสร็จแล้ว',

        // Achievement
        achievementTitle: 'Denim Champions! 🎉',
        achievementDesc: 'ขอแสดงความยินดี! คุณทำภารกิจ NamtanFilm × Levi’s ครบแล้ว 🎉',
        downloadFrame: '⬇️ ดาวน์โหลดกรอบรูป',
        shareToX: '📱 แชร์ไป X',

        // Caption Generator
        generateCaption: 'สุ่มข้อความ',
        noPositiveMessages: 'ไม่มีข้อความจากชีต (โหลดไม่สำเร็จหรือชีตว่าง)',
        regenerate: 'สุ่มใหม่',
        generatedMessage: 'ข้อความที่สร้าง:',
        copyMessageOnly: 'คัดลอกข้อความ',
        copyHashtagsOnly: 'คัดลอกแฮชแท็ก',
        copyBoth: 'คัดลอกทั้งหมด',
        copiedMessage: 'คัดลอกข้อความแล้ว!',
        copiedHashtags: 'คัดลอก Hashtags แล้ว!',
        copiedBoth: 'คัดลอกทั้งหมดแล้ว!',

        // Focus
        focusBadge: '⭐ สำคัญ',
        hotBadge: '🔥 HOT',
        pinnedBadge: '📌 ปักหมุด',

        // Compact Copy Buttons
        copyMsgBtn: 'คัดลอกข้อความ',
        copyTagsBtn: 'คัดลอกแฮชแท็ก',
        copyAllBtn: 'คัดลอก ข้อความ + แฮชแท็ก',
        copiedBtn: '✓ คัดลอกแล้ว!',

        // Modal Section Labels
        sectionHashtags: 'Hashtags',
        sectionMessage: 'สุ่มข้อความ',
        sectionCopyAll: 'คัดลอกทั้งหมด',
        sectionActions: 'การดำเนินการ',
        sectionTips: '💡 วิธีการใช้งาน',
        markDoneBtn: '✓ ทำสำเร็จแล้ว',
        undoDoneBtn: '↩ ยกเลิก',

        // Usage Tips per platform
        igTip1: '📝 คัดลอกข้อความ → ใส่ใน Comment IG (อย่าลืมกดไลก์ด้วยนะ ❤️)',
        igTip2: '📸 คัดลอกข้อความ + # → สร้างโพสต์ / Reels (แชร์และเซฟเก็บไว้ด้วยน้า ✨)',
        igTip3: '#️⃣ คัดลอก # เท่านั้น → ใส่ใน Stories (แชร์ต่อให้ชื่อเสียงปังๆ 🚀)',
        xTip1: '✍️ ข้อความ / # / ข้อความ+# → Reply หรือสร้างโพสต์บน X (อย่าลืมกดไลก์ รีโพสต์ และโควตด้วยนะ 🔁)',
        ttTip1: '📝 คัดลอกข้อความ → ใส่ใน Comment TikTok (อย่าลืมกดไลก์ ❤️)',
        ttTip2: '🎬 คัดลอกข้อความ + # → สร้างโพสต์ / Clip (แชร์และเซฟเข้าบุ๊กมาร์กด้วยนะ 🔖)',
        ytTip1: '📝 คัดลอกข้อความ → ใส่ใน Comment YouTube (อย่าลืมกดไลก์ 👍)',
        ytTip2: '🎥 คัดลอกข้อความ + # → สร้าง Video / Short (และกดแชร์คลิปออกไปด้วยนะ 📤)',
        fbTip1: '📝 คัดลอกข้อความ → ใส่ใน Comment Facebook (อย่าลืมกดไลก์และแชร์เป็นสาธารณะด้วยนะ 👍)',

        // Stats Labels & Descriptions
        totalLikesLabel: 'ถูกใจทั้งหมด',
        totalLikesDesc: 'รวมยอดถูกใจจากทุกแพลตฟอร์ม',
        commentsLabel: 'คอมเมนต์',
        commentsDesc: 'คอมเมนต์และตอบกลับ',
        sharesLabel: 'แชร์',
        sharesDesc: 'แชร์ โควต รีทวีต ส่งต่อ',
        quotesWord: 'โควต',
        savesLabel: 'บันทึก',
        savesDesc: 'บันทึกคอลเล็กชัน',
        viewsLabel: 'ยอดชม',
        viewsDesc: 'ยอดผู้เข้าชมวิดีโอ',
        statsSource: 'รวมจากทุกโพสต์ใน Google Sheet (ตามช่วง MIV/EMV)',

        // Phrases
        minimize: 'ย่อขนาด',
        globalStatsShort: 'ยอดรวม',
        sixteenDays: 'ตลอดทั้งแคมเปญ',
        phasePreDesc: 'ช่วงเปิดตัว / Teaser',
        phaseAirportDesc: 'วันงานเปิดตัว / Event',
        phaseShowDesc: 'แคมเปญหลัก / Campaign',
        phaseAftermathDesc: 'เก็บตกแคมเปญ / Aftermath',
        tapToHide: 'ซ่อนภารกิจ',
        tapToExpand: 'คลิกเพื่อดูภารกิจสำคัญ 🔥',
        dashboardTip: '✦ ทิป: คลิกเพื่อสลับมุมมอง',

        // Short Phrases
        allLabel: 'ทั้งหมด',
        preLabel: 'Teaser',
        airportLabel: 'Event',
        showLabel: 'Campaign',
        aftermathLabel: 'After',
        sixteenDaysShort: 'ทั้งแคมเปญ',
        phasePreShort: 'Teaser',
        phaseAirportShort: 'Event',
        phaseShowShort: 'Campaign',
        phaseAftermathShort: 'After',

        // Metrics Short
        likes: 'ถูกใจ',
        comments: 'คอมเมนต์',
        reposts: 'รีโพสต์',
        shares: 'แชร์',
        saves: 'บันทึก',
        views: 'ยอดชม',
        sends: 'ส่ง',
        replies: 'ตอบกลับ',
        view: 'ชม',

        // Platforms
        igLabel: 'Instagram/Reels',
        ttLabel: 'TikTok',
        xLabel: 'X',
        threadsLabel: 'Threads',
        fbLabel: 'Facebook',
        ytLabel: 'YouTube/Short',
    },
    en: {
        // Header
        appTitle: 'NamtanFilm × Levi’s 👖✨',
        featuredEngagementTitle: "Boost NamtanFilm × Levi’s! 🚀",
        featuredEngagementToggle: 'Boost 🚀',
        importantMediaTitle: 'Fashion Media & Partners 🌟',
        importantMediaToggle: 'Focused Media',
        all: 'All',
        hide: '✓ Hide',
        show: '○ Show',

        // Loading
        loading: 'Loading...',
        error: 'Failed to load data. Please check Google Sheet URL',

        // Stats
        pending: 'Pending',
        done: '✓ Done',
        progress: 'progress',
        completed: 'Completed',

        // Task list
        tasks: 'All Missions',
        noTitle: 'No title',
        scrollToLoad: 'Scroll to load more...',
        noTasks: 'No tasks yet',
        missionCount: 'Total missions',
        missionCountUnit: 'posts',
        noBoostPosts: 'No boost posts found (add boost=x in sheet)',
        totalEngagementLabel: 'Total',
        allDone: 'All done!',
        summary: 'Summary',
        globalStats: 'Global Platform Stats',
        totalStats: 'Total Stats',
        igStats: 'Total IG Stats',
        tiktokStats: 'Total TikTok Stats',
        xStats: 'Total X Stats',
        facebookStats: 'Total Facebook Stats',
        youtubeStats: 'Total YouTube Stats',
        missionImpact: 'Mission Impact Stats',
        completedTasks: 'Completed Tasks',
        updateData: 'Update Data',
        totalLabel: 'Total',

        // Modal
        hashtagsLabel: '📝 Hashtags to use:',
        noHashtags: 'No hashtags',
        copied: '✓ Copied!',
        copyText: '📋 Copy text',
        goPost: '🚀 Go post!',
        markDone: '✓ Mark as done',

        // Achievement
        achievementTitle: 'Denim Champions! 🎉',
        achievementDesc: 'Congratulations! You completed the NamtanFilm × Levi’s Missions 🎉',
        downloadFrame: '⬇️ Download Frame',
        shareToX: '📱 Share to X',

        // Caption Generator
        generateCaption: 'Random Caption',
        noPositiveMessages: 'No messages from sheet (load failed or sheet empty)',
        regenerate: 'Randomize',
        generatedMessage: 'Generated Message:',
        copyMessageOnly: 'Copy Message',
        copyHashtagsOnly: 'Copy Hashtags',
        copyBoth: 'Copy All',
        copiedMessage: 'Message Copied!',
        copiedHashtags: 'Hashtags Copied!',
        copiedBoth: 'All Copied!',

        // Focus
        focusBadge: '⭐ Focus',
        hotBadge: '🔥 HOT',
        pinnedBadge: '📌 Pinned',

        // Compact Copy Buttons
        copyMsgBtn: 'Copy Message',
        copyTagsBtn: 'Copy Hashtags',
        copyAllBtn: 'Copy Message + Hashtags',
        copiedBtn: '✓ Copied!',

        // Modal Section Labels
        sectionHashtags: 'Hashtags',
        sectionMessage: 'Random Caption',
        sectionCopyAll: 'Copy All',
        sectionActions: 'Actions',
        sectionTips: '💡 How to use',
        markDoneBtn: '✓ Mark Done',
        undoDoneBtn: '↩ Undo',

        // Usage Tips per platform
        igTip1: "📝 Copy message → paste as IG Comment (Don't forget to like! ❤️)",
        igTip2: "📸 Copy message + # → create Post / Reels (Share and Save too! ✨)",
        igTip3: "#️⃣ Copy # only → paste in Stories (Share for more impact! 🚀)",
        xTip1: "✍️ Msg / # / Msg+# → Reply/Post on X (Remember to Like, Repost & Quote! 🔁)",
        ttTip1: "📝 Copy message → paste as TikTok Comment (Don't forget to like! ❤️)",
        ttTip2: "🎬 Copy message + # → create Post / Clip (Share and Save to bookmarks! 🔖)",
        ytTip1: "📝 Copy message → paste as YouTube Comment (Don't forget to like! 👍)",
        ytTip2: "🎥 Copy message + # → create Video / Short (And share the video! 📤)",
        fbTip1: "📝 Copy message → paste as Facebook Comment (Don't forget to like & share publicly! 👍)",

        // Stats Labels & Descriptions
        totalLikesLabel: 'Total Likes',
        totalLikesDesc: 'Total likes across all platforms',
        commentsLabel: 'Comments',
        commentsDesc: 'Comments and replies',
        sharesLabel: 'Shares',
        sharesDesc: 'Shares, quotes, and retweets',
        quotesWord: 'quotes',
        savesLabel: 'Saves',
        savesDesc: 'Saves and bookmarks',
        viewsLabel: 'Views',
        viewsDesc: 'Total video views',
        statsSource: 'Sum of all posts from Google Sheet (by MIV/EMV period)',

        // Phrases
        minimize: 'Minimize',
        globalStatsShort: 'Total',
        sixteenDays: 'Full Campaign',
        phasePreDesc: 'Teaser Period',
        phaseAirportDesc: 'Launch Event Day',
        phaseShowDesc: 'Main Campaign',
        phaseAftermathDesc: 'Recap & Aftermath',
        tapToHide: 'Click to hide',
        tapToExpand: 'Click to view',
        dashboardTip: '✦ Tip: Click to switch views',

        // Short Phrases
        allLabel: 'All',
        preLabel: 'Teaser',
        airportLabel: 'Event',
        showLabel: 'Campaign',
        aftermathLabel: 'After',
        sixteenDaysShort: 'Campaign',
        phasePreShort: 'Teaser',
        phaseAirportShort: 'Event',
        phaseShowShort: 'Campaign',
        phaseAftermathShort: 'After',

        // Metrics Short
        likes: 'Likes',
        comments: 'Comments',
        reposts: 'Reposts',
        shares: 'Shares',
        saves: 'Saves',
        views: 'Views',
        sends: 'Sends',
        replies: 'Replies',
        view: 'View',

        // Platforms
        igLabel: 'Instagram/Reels',
        ttLabel: 'TikTok',
        xLabel: 'X',
        threadsLabel: 'Threads',
        fbLabel: 'Facebook',
        ytLabel: 'YouTube/Short',
    },
} as const;

export type TranslationKey = keyof typeof translations.th;
