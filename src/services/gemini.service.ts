import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPool } from '../config/database';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export interface GeminiCitation {
    doc_title: string;
    doc_id: string;
    snippet: string;
    link?: string;
    type?: 'manual' | 'fault' | 'vehicle';
    page?: number;
}

export interface GeminiResponse {
    answer: string;
    citations: GeminiCitation[];
    confidence: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here') {
            this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });
            console.log('✅ Gemini AI initialized successfully');
        } else {
            console.warn('⚠️ Gemini API Key not configured. Using fallback search.');
        }
    }

    /**
     * Process user query with Gemini AI
     */
    async processQuery(userId: string, query: string, sessionId: string, vehicleId?: string): Promise<GeminiResponse> {
        try {
            // 1. Search database for relevant context
            const context = await this.searchDatabaseContext(query, vehicleId);

            // 2. Always use Gemini if available (even without database results)
            if (this.model) {
                return await this.generateGeminiResponse(query, context, vehicleId);
            }

            // 3. Fallback to basic search only if Gemini is not available
            return this.generateBasicResponse(query, context);
        } catch (error) {
            console.error('Error in processQuery:', error);

            // Even on error, try to use Gemini for a helpful response
            if (this.model) {
                try {
                    return await this.generateGeminiResponse(query, { hasResults: false, manuals: [], faults: [], vehicles: [] }, vehicleId);
                } catch (geminiError) {
                    console.error('Gemini fallback error:', geminiError);
                }
            }

            return this.generateBasicResponse(query, { hasResults: false, manuals: [], faults: [], vehicles: [] });
        }
    }

    /**
     * Search database for relevant context - IMPROVED with smarter search
     */
    private async searchDatabaseContext(query: string, vehicleId?: string) {
        const keywords = this.extractKeywords(query);
        const pool = getPool();

        let [manuals, faults, vehicles] = await Promise.all([
            this.searchManuals(pool, keywords, vehicleId),
            this.searchFaults(pool, keywords, vehicleId),
            this.searchVehicles(pool, keywords)
        ]);

        // Fallback: If no manuals found with keywords, try full-text search
        if (manuals.length === 0) {
            console.log('⚠️ No keyword match, trying full-text search...');
            manuals = await this.fullTextSearchManuals(pool, query, vehicleId);
        }

        // Final fallback: Get all available manuals
        if (manuals.length === 0) {
            console.log('⚠️ No full-text match, fetching all available manuals...');
            const allManualsQuery = vehicleId
                ? 'SELECT id, title, description, file_path, vehicle_type, content FROM technical_manuals WHERE vehicle_id = $1 LIMIT 3'
                : 'SELECT id, title, description, file_path, vehicle_type, content FROM technical_manuals LIMIT 3';

            const params = vehicleId ? [vehicleId] : [];
            const result = await pool.query(allManualsQuery, params);
            manuals = result.rows;
            console.log(`📚 Found ${manuals.length} manuals in database (fallback)`);
        }

        return {
            hasResults: manuals.length > 0 || faults.length > 0 || vehicles.length > 0,
            manuals,
            faults,
            vehicles,
            keywords,
            vehicleId
        };
    }

    /**
     * Generate response using Gemini AI - IMPROVED with better prompting
     */
    private async generateGeminiResponse(query: string, context: any, vehicleId?: string): Promise<GeminiResponse> {
        try {
            // Build comprehensive context for Gemini
            const contextText = this.buildContextText(context);
            const hasManuals = context.manuals && context.manuals.length > 0;
            const hasContent = hasManuals && context.manuals.some((m: any) => m.content && m.content.length > 50);

            const prompt = `أنت مساعد فني ذكي متخصص في صيانة وإصلاح المركبات الثقيلة (شاحنات، حافلات، معدات عسكرية). لديك خبرة واسعة في قراءة وفهم الكراسات الفنية Technical Manuals (TM) وتقديم إرشادات دقيقة للفنيين.

**السياق المتوفر من قاعدة البيانات:**
${contextText}

**سؤال المستخدم:**
${query}

**مهمتك:**
${hasContent ? `
🎯 **يوجد محتوى كراسات فنية متاح - استخدمه بالكامل!**

**قواعد إلزامية للإجابة:**
1. 📖 **اقرأ وافهم المحتوى المتوفر بالكامل** - ابحث فيه عن كل المعلومات المتعلقة بسؤال المستخدم
2. 🚫 **تجاهل تماماً ترويسات وتذييلات الصفحات** (مثل أرقام الصفحات "Page 1 of 50", التواريخ, أسماء الملفات) ولا تدرجها في الإجابة
3. 🔍 **استخرج كل التفاصيل ذات الصلة** - لا تكتفِ بذكر أن الكراسة موجودة، بل اعرض المعلومات الفعلية منها
4. 🌐 **ترجم كل المحتوى الإنجليزي للعربية** بدقة واحترافية مع ذكر المصطلح الإنجليزي بين قوسين
5. ✍️ **قدم إجابة شاملة ومفصلة** تغطي جميع جوانب السؤال بناءً على المحتوى المتوفر
6. 📝 **نظّم الإجابة بشكل واضح** مع عناوين وخطوات مرقمة ونقاط واضحة
7. 🔢 **احتفظ بالأرقام والمواصفات كما هي** (مثل: 24V، 15 PSI، 250 hours، Part Numbers)
8. ⚠️ **أضف تحذيرات السلامة** إذا كانت موجودة في الكراسة
9. 📌 **اذكر مصدر المعلومة** (اسم الكراسة)
10. 🔧 **إذا وجدت أرقام قطع غيار (Part Numbers) أو أدوات مطلوبة، اذكرها بوضوح**
11. 📊 **إذا وجدت جداول أو قيم محددة، اعرضها بشكل منظم**

**هام جداً:** لا تقل فقط "يوجد كراسة تحتوي على معلومات" - بل اعرض المعلومات نفسها بالتفصيل!

` : hasManuals ? `
📖 **يوجد كراسات فنية لكن بدون محتوى نصي مستخرج.**

1. أجب على السؤال من معرفتك العامة في صيانة المركبات
2. اذكر أن الكراسة موجودة ومتاحة للرجوع إليها
3. انصح المستخدم بإعادة رفع الكراسة لاستخراج المحتوى منها

` : `
💡 **لا توجد كراسات فنية في قاعدة البيانات تتعلق بهذا السؤال.**

1. ✅ أجب على السؤال بناءً على معرفتك العامة في صيانة المركبات
2. 📢 وضّح بوضوح أن هذه الإجابة من المعرفة العامة وليست من كراسة فنية محددة
3. 📤 اقترح رفع الكراسة الفنية ذات الصلة إلى النظام للحصول على إجابات أكثر دقة
`}

**تنسيق الإجابة المطلوب:**

### 🔍 الإجابة:
[اكتب إجابة مفصلة ومترجمة بالعربية تجيب على سؤال المستخدم بالكامل مع تفاصيل من الكراسة إن وجدت]

### 📋 الخطوات / التفاصيل:
[خطوات مرقمة أو تفاصيل منظمة]

### ⚙️ المواصفات الفنية: (إن وجدت)
[مواصفات وأرقام]

### ⚠️ تحذيرات السلامة: (إن وجدت)
[تحذيرات]

### 💡 ملاحظات إضافية:
[أي معلومات مفيدة إضافية]

---
📚 **المصدر**: [اسم الكراسة أو "المعرفة العامة"]

**قواعد عامة للإجابة:**
- ✅ **الإجابة بالعربية 100%** مع ذكر المصطلحات الإنجليزية بين قوسين عند الحاجة
- ✅ **استخدم رموز تعبيرية** لتحسين القراءة (🔧 ⚙️ ✅ ⚠️ 💡 📖 🔍 📋)
- ✅ **كن دقيقاً ومحدداً** - لا تعطِ معلومات عامة إذا كانت التفاصيل متوفرة في المحتوى
- ✅ **نظّم الإجابة بشكل احترافي** مع عناوين واضحة
- ✅ **أضف قيمة حقيقية** - اعرض المعلومات الفعلية لا مجرد إشارة لوجود كراسة

**ابدأ الإجابة الآن:**`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const answer = response.text();

            // Build citations from context
            const citations = this.buildCitations(context);

            return {
                answer: answer.trim(),
                citations,
                confidence: hasContent ? 0.95 : hasManuals ? 0.7 : 0.5
            };
        } catch (error) {
            console.error('Gemini API Error:', error);
            // Fallback to basic response
            return this.generateBasicResponse(query, context);
        }
    }

    /**
     * Build context text from database results - IMPROVED with FULL content
     */
    private buildContextText(context: any): string {
        let text = '';

        if (context.manuals.length > 0) {
            text += '📖 **الكراسات الفنية المتوفرة:**\n';
            context.manuals.forEach((m: any, i: number) => {
                text += `\n--- كراسة ${i + 1}: **${m.title}** ---\n`;
                if (m.vehicle_type) text += `🚗 نوع المركبة: ${m.vehicle_type}\n`;
                if (m.description) text += `📝 الوصف: ${m.description}\n`;

                // Send FULL content (up to 30,000 chars per manual) for comprehensive answers
                if (m.content && m.content.length > 0) {
                    const contentToSend = m.content.length > 30000
                        ? m.content.substring(0, 30000) + '\n... [تم اقتطاع بقية المحتوى]'
                        : m.content;
                    text += `📄 **المحتوى الكامل للكراسة:**\n`;
                    text += `${contentToSend}\n`;
                } else if (m.content_preview && m.content_preview.length > 0) {
                    text += `📄 المحتوى المتاح:\n${m.content_preview}\n`;
                } else {
                    text += `⚠️ لا يوجد محتوى نصي مستخرج من هذه الكراسة\n`;
                }
                text += `--- نهاية كراسة ${i + 1} ---\n\n`;
            });
        }

        if (context.faults.length > 0) {
            text += '\n🛠️ **الأعطال المسجلة:**\n';
            context.faults.forEach((f: any, i: number) => {
                text += `${i + 1}. **${f.title}**\n`;
                if (f.description) text += `   الوصف: ${f.description}\n`;
                if (f.status) text += `   الحالة: ${f.status}\n`;
                if (f.solution) text += `   الحل: ${f.solution}\n`;
                text += '\n';
            });
        }

        if (context.vehicles.length > 0) {
            text += '\n🚗 **المركبات ذات الصلة:**\n';
            context.vehicles.forEach((v: any, i: number) => {
                text += `${i + 1}. ${v.plate_number} - ${v.vehicle_type}\n`;
                text += `   الحالة: ${v.status === 'active' ? 'نشطة' : 'في الصيانة'}\n`;
                text += '\n';
            });
        }

        if (!text) {
            text = 'لا توجد معلومات محددة في قاعدة البيانات تتعلق بهذا الاستفسار.';
        }

        return text;
    }

    /**
     * Build citations array
     */
    private buildCitations(context: any): GeminiCitation[] {
        const citations: GeminiCitation[] = [];
        const keywords = context.keywords || [];

        // Add manual citations
        if (context.manuals) {
            context.manuals.forEach((m: any) => {
                let snippet = '';
                let pageNumber: number | undefined = undefined;

                // Find best snippet and page number
                if (m.content && keywords.length > 0) {
                    // Find first keyword occurrence
                    const contentLower = m.content.toLowerCase();
                    let bestIndex = -1;

                    for (const keyword of keywords) {
                        const idx = contentLower.indexOf(keyword.toLowerCase());
                        if (idx >= 0) {
                            bestIndex = idx;
                            break;
                        }
                    }

                    if (bestIndex >= 0) {
                        // Extract snippet around match
                        const start = Math.max(0, bestIndex - 60);
                        const end = Math.min(m.content.length, bestIndex + 100);
                        snippet = (start > 0 ? '...' : '') + m.content.substring(start, end).trim() + '...';

                        // Find page number
                        // Search backwards from bestIndex for "--- Page X ---"
                        // We extract the substring up to the match and find the last occurrence of the marker
                        const textBeforeMatch = m.content.substring(0, bestIndex);
                        const matches = [...textBeforeMatch.matchAll(/--- Page (\d+) ---/g)];
                        if (matches.length > 0) {
                            pageNumber = parseInt(matches[matches.length - 1][1]);
                        } else {
                            // Maybe the first page marker is slightly after? or we are on page 1 implied?
                            pageNumber = 1;
                        }
                    }
                }

                // Fallback if no specific match found
                if (!snippet) {
                    snippet = m.content
                        ? m.content.substring(0, 150).trim() + '...'
                        : (m.content_preview
                            ? m.content_preview.substring(0, 150).trim() + '...'
                            : (m.description ? m.description.substring(0, 100) + '...' : 'ملف فني بصيغة PDF'));

                    if (m.content) {
                        const match = /--- Page (\d+) ---/.exec(m.content);
                        if (match) pageNumber = parseInt(match[1]);
                    }
                }

                citations.push({
                    doc_title: m.title,
                    doc_id: m.id,
                    snippet,
                    link: `/uploads/manuals/${m.file_path.split(/[\\/]/).pop()}`,
                    type: 'manual',
                    page: pageNumber
                });
            });
        }

        // Add fault citations
        if (context.faults) {
            context.faults.forEach((f: any) => {
                citations.push({
                    doc_title: `عطل: ${f.title}`,
                    doc_id: f.id,
                    snippet: f.description ? f.description.substring(0, 80) + '...' : '',
                    link: `/diagnosis/common/${f.id}`,
                    type: 'fault'
                });
            });
        }

        // Add vehicle citations (limit to avoid clutter)
        if (context.vehicles && citations.length < 6) {
            context.vehicles.forEach((v: any) => {
                citations.push({
                    doc_title: `مركبة: ${v.plate_number}`,
                    doc_id: v.id,
                    snippet: `${v.vehicle_type} - ${v.status === 'active' ? 'نشطة' : 'في الصيانة'}`,
                    link: `/vehicles/${v.id}`,
                    type: 'vehicle'
                });
            });
        }

        return citations;
    }

    /**
     * Generate basic response (fallback when Gemini is not available)
     */
    private generateBasicResponse(query: string, context: any): GeminiResponse {
        let answer = '';
        const citations = this.buildCitations(context);

        if (context.manuals && context.manuals.length > 0) {
            answer += `🔍 **من الكراسات الفنية:**\nعثرت على ${context.manuals.length} كراسة تحتوي على معلومات ذات صلة.\n\n`;

            // Show content preview if available
            context.manuals.forEach((m: any) => {
                if (m.content && m.content.length > 50) {
                    answer += `📖 **${m.title}:**\n`;
                    answer += m.content.substring(0, 500) + '...\n\n';
                }
            });
        }

        if (context.faults && context.faults.length > 0) {
            answer += `🛠️ **من سجلات الأعطال:**\nيوجد ${context.faults.length} حالات مشابهة تم التعامل معها سابقاً.\n\n`;
        }

        if (context.vehicles && context.vehicles.length > 0) {
            answer += `🚗 **المركبات ذات الصلة:**\nعثرت على ${context.vehicles.length} مركبة.\n\n`;
        }

        if (citations.length === 0) {
            answer = '❌ لم أستطع العثور على معلومات دقيقة في السجلات أو الكراسات الفنية.\n\n💡 **اقتراحات:**\n- تأكد من صياغة السؤال بوضوح\n- استخدم كلمات مفتاحية محددة\n- تحقق من رفع الكراسات الفنية ذات الصلة';
        } else if (!answer) {
            answer = '✅ إليك النتائج التي وجدتها متعلقة ببحثك:';
        }

        return {
            answer: answer.trim(),
            citations,
            confidence: citations.length > 0 ? 0.6 : 0.2
        };
    }

    /**
     * Extract keywords from query - IMPROVED with better Arabic support
     */
    private extractKeywords(query: string): string[] {
        // Common stop words to filter out (Arabic and English)
        const stopWords = [
            'في', 'من', 'إلى', 'على', 'عن', 'هو', 'هي', 'هذا', 'هذه', 'ذلك', 'تلك',
            'و', 'أو', 'ثم', 'لكن', 'بل', 'إن', 'أن', 'لأن', 'حتى', 'منذ',
            'كيف', 'ماذا', 'لماذا', 'أين', 'متى', 'كم', 'ما', 'هل', 'أي',
            'يا', 'لا', 'نعم', 'كل', 'بعض', 'مع', 'بين', 'عند', 'قد',
            'the', 'is', 'in', 'on', 'at', 'to', 'a', 'an', 'of', 'for',
            'what', 'how', 'where', 'when', 'why', 'which', 'who',
            'عطني', 'اعطني', 'ابي', 'ابغى', 'وش', 'ايش', 'شنو',
            'أريد', 'أبي', 'أبغى', 'ممكن', 'لو', 'سمحت'
        ];

        // Technical term mappings (English <-> Arabic)
        const termMappings: { [key: string]: string[] } = {
            'engine': ['محرك', 'موتور', 'motor'],
            'محرك': ['engine', 'motor'],
            'brake': ['فرامل', 'فرملة', 'brakes'],
            'فرامل': ['brake', 'brakes'],
            'transmission': ['ناقل', 'جير', 'gearbox', 'قير'],
            'ناقل': ['transmission', 'gearbox'],
            'oil': ['زيت', 'زيوت'],
            'زيت': ['oil'],
            'maintenance': ['صيانة', 'service'],
            'صيانة': ['maintenance', 'service'],
            'repair': ['إصلاح', 'تصليح'],
            'إصلاح': ['repair', 'fix'],
            'cooling': ['تبريد', 'radiator', 'رديتر'],
            'تبريد': ['cooling', 'radiator'],
            'مصراع': ['ramp', 'door', 'hatch', 'باب'],
            'برادلي': ['bradley', 'm2', 'm3'],
            'bradley': ['برادلي', 'مدرعة'],
            'hydraulic': ['هيدروليك', 'هيدرولك'],
            'هيدروليك': ['hydraulic'],
            'electrical': ['كهرباء', 'كهربائي'],
            'كهرباء': ['electrical', 'electric'],
            'tire': ['إطار', 'إطارات', 'كفر'],
            'إطار': ['tire', 'tyre'],
            'battery': ['بطارية', 'بطاريات'],
            'بطارية': ['battery'],
            'filter': ['فلتر', 'فلاتر'],
            'فلتر': ['filter'],
            'pump': ['مضخة', 'طرمبة'],
            'مضخة': ['pump'],
            'turret': ['برج', 'المدفع'],
            'برج': ['turret', 'tower'],
            'track': ['جنزير', 'سير'],
            'جنزير': ['track'],
            'suspension': ['تعليق', 'نظام تعليق'],
            'تعليق': ['suspension'],
            'fuel': ['وقود', 'ديزل', 'بنزين'],
            'وقود': ['fuel', 'diesel', 'gasoline']
        };

        const baseKeywords = query
            .toLowerCase()
            .split(/[\s,،.؟?!:;]+/)
            .filter(word => word.length > 1)
            .filter(word => !stopWords.includes(word))
            .map(word => word.trim())
            .filter(word => word.length > 0);

        // Add related terms
        const expandedKeywords = new Set(baseKeywords);
        baseKeywords.forEach(keyword => {
            if (termMappings[keyword]) {
                termMappings[keyword].forEach(related => expandedKeywords.add(related));
            }
        });

        return Array.from(expandedKeywords);
    }

    /**
     * Full-text search in manuals using PostgreSQL text search
     */
    private async fullTextSearchManuals(pool: any, query: string, vehicleId?: string) {
        try {
            // Build search query - search in content using ILIKE with the full query
            let sqlQuery = `
                SELECT id, title, description, file_path, vehicle_type, content
                FROM technical_manuals 
                WHERE content ILIKE $1 OR title ILIKE $1 OR description ILIKE $1
            `;
            const params: any[] = [`%${query}%`];

            if (vehicleId) {
                sqlQuery += ` AND vehicle_id = $2`;
                params.push(vehicleId);
            }

            sqlQuery += ` ORDER BY 
                CASE 
                    WHEN content ILIKE $1 THEN 1
                    WHEN title ILIKE $1 THEN 2
                    ELSE 3
                END
                LIMIT 5`;

            const res = await pool.query(sqlQuery, params);
            console.log(`🔍 Full-text search found ${res.rows.length} manuals for query: "${query}"`);
            return res.rows;
        } catch (e) {
            console.error('Error in full-text search:', e);
            return [];
        }
    }

    /**
     * Search manuals in database - IMPROVED to get FULL content
     */
    private async searchManuals(pool: any, keywords: string[], vehicleId?: string) {
        if (keywords.length === 0) return [];

        const conditions: string[] = [];
        const params: string[] = [];
        let paramIndex = 1;

        keywords.forEach(keyword => {
            if (keyword.length > 1) { // Allow shorter keywords (was > 2)
                conditions.push(`(
                    title ILIKE $${paramIndex} OR 
                    description ILIKE $${paramIndex} OR 
                    content ILIKE $${paramIndex} OR
                    vehicle_type ILIKE $${paramIndex}
                )`);
                params.push(`%${keyword}%`);
                paramIndex++;
            }
        });

        if (conditions.length === 0) return [];

        let whereClause = conditions.join(' OR ');
        if (vehicleId) {
            whereClause = `(${whereClause}) AND vehicle_id = $${paramIndex}`;
            params.push(vehicleId);
        }

        // Get FULL content instead of just 5000 chars
        const query = `
            SELECT id, title, description, file_path, vehicle_type, content
            FROM technical_manuals 
            WHERE ${whereClause}
            ORDER BY 
                CASE 
                    WHEN title ILIKE $1 THEN 1
                    WHEN description ILIKE $1 THEN 2
                    WHEN vehicle_type ILIKE $1 THEN 3
                    ELSE 4
                END
            LIMIT 5
        `;

        try {
            const res = await pool.query(query, params);
            console.log(`🔍 Found ${res.rows.length} manuals for keywords:`, keywords);

            // Log content availability
            res.rows.forEach((r: any) => {
                console.log(`  📖 "${r.title}" - content: ${r.content ? r.content.length + ' chars' : 'NONE'}`);
            });

            return res.rows;
        } catch (e) {
            console.error('Error searching manuals:', e);
            return [];
        }
    }

    /**
     * Search faults in database
     */
    private async searchFaults(pool: any, keywords: string[], vehicleId?: string) {
        if (keywords.length === 0) return [];

        let conditions = keywords.map((_, i) => `(title ILIKE $${i + 1} OR description ILIKE $${i + 1})`).join(' OR ');
        const params: any[] = keywords.map(k => `%${k}%`);

        if (vehicleId) {
            conditions = `(${conditions}) AND vehicle_id = $${params.length + 1}`;
            params.push(vehicleId);
        }

        const query = `SELECT id, title, description, status FROM faults WHERE ${conditions} LIMIT 5`;

        try {
            const res = await pool.query(query, params);
            console.log(`🔍 Found ${res.rows.length} faults`);
            return res.rows;
        } catch (e) {
            console.error('Error searching faults:', e);
            return [];
        }
    }

    /**
     * Search vehicles in database
     */
    private async searchVehicles(pool: any, keywords: string[]) {
        if (keywords.length === 0) return [];

        const conditions = keywords.map((_, i) => `(plate_number ILIKE $${i + 1} OR vehicle_type ILIKE $${i + 1})`).join(' OR ');
        const params = keywords.map(k => `%${k}%`);
        const query = `SELECT id, plate_number, vehicle_type, status FROM vehicles WHERE ${conditions} LIMIT 3`;

        try {
            const res = await pool.query(query, params);
            console.log(`🔍 Found ${res.rows.length} vehicles`);
            return res.rows;
        } catch (e) {
            console.error('Error searching vehicles:', e);
            return [];
        }
    }
}

export const geminiService = new GeminiService();
