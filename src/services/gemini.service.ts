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
     * Search database for relevant context
     */
    private async searchDatabaseContext(query: string, vehicleId?: string) {
        const keywords = this.extractKeywords(query);
        const pool = getPool();

        let [manuals, faults, vehicles] = await Promise.all([
            this.searchManuals(pool, keywords, vehicleId),
            this.searchFaults(pool, keywords, vehicleId),
            this.searchVehicles(pool, keywords)
        ]);

        // Fallback: If no manuals found, get all available manuals (limited to 3)
        if (manuals.length === 0) {
            console.log('⚠️ No manuals found with keywords, fetching all available manuals...');
            const allManualsQuery = vehicleId
                ? 'SELECT id, title, description, file_path, vehicle_type, SUBSTRING(COALESCE(content, \'\'), 1, 5000) as content_preview FROM technical_manuals WHERE vehicle_id = $1 LIMIT 3'
                : 'SELECT id, title, description, file_path, vehicle_type, SUBSTRING(COALESCE(content, \'\'), 1, 5000) as content_preview FROM technical_manuals LIMIT 3';

            const params = vehicleId ? [vehicleId] : [];
            const result = await pool.query(allManualsQuery, params);
            manuals = result.rows;
            console.log(`📚 Found ${manuals.length} manuals in database`);
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
     * Generate response using Gemini AI
     */
    private async generateGeminiResponse(query: string, context: any, vehicleId?: string): Promise<GeminiResponse> {
        try {
            // Build context for Gemini
            const contextText = this.buildContextText(context);

            const hasManuals = context.manuals && context.manuals.length > 0;

            const prompt = `أنت مساعد فني ذكي متخصص في صيانة وإصلاح المركبات الثقيلة (شاحنات، حافلات، معدات عسكرية). لديك خبرة واسعة في قراءة وفهم الكراسات الفنية Technical Manuals (TM) وتقديم إرشادات دقيقة للفنيين.

**السياق المتوفر من قاعدة البيانات:**
${contextText}

**سؤال المستخدم:**
${query}

**مهمتك:**
${hasManuals ? `
🎯 **يوجد كراسات فنية متاحة - استخدمها بذكاء!**

**قواعد إلزامية:**
1. 📖 **اقرأ وافهم المحتوى المتوفر بالكامل** - لا تتجاهل أي تفاصيل
2. 🔍 **ابحث عن المعلومات ذات الصلة المباشرة** بسؤال المستخدم
3. 🌐 **ترجم كل المحتوى الإنجليزي للعربية** بدقة واحترافية
4. ✍️ **قدم إجابة شاملة ومفصلة** تغطي جميع جوانب السؤال
5. 📝 **نظّم الإجابة بشكل واضح** مع عناوين وخطوات مرقمة
6. 🔢 **احتفظ بالأرقام والمواصفات كما هي** (مثل: 24V، 15 PSI، 250 hours)
7. ⚠️ **أضف تحذيرات السلامة** إذا كانت موجودة في الكراسة
8. 📌 **اذكر مصدر المعلومة** (اسم الكراسة ورقم الصفحة إن وجد)

**تنسيق الإجابة المطلوب:**

📖 **من الكراسة الفنية: [اسم الكراسة]**

### 🔍 الإجابة:
[اكتب إجابة مفصلة ومترجمة بالعربية تجيب على سؤال المستخدم بالكامل]

### 📋 الخطوات العملية:
1. **[عنوان الخطوة]**: [شرح تفصيلي بالعربية]
2. **[عنوان الخطوة]**: [شرح تفصيلي بالعربية]
3. **[عنوان الخطوة]**: [شرح تفصيلي بالعربية]

### ⚙️ المواصفات الفنية:
- **[اسم المواصفة]**: [القيمة]
- **[اسم المواصفة]**: [القيمة]

### ⚠️ تحذيرات السلامة:
- [تحذير 1]
- [تحذير 2]

### 💡 ملاحظات إضافية:
- [ملاحظة مهمة 1]
- [ملاحظة مهمة 2]

---
📚 **المصدر**: [اسم الكراسة الفنية]

` : `
💡 **لا توجد كراسات فنية محددة في قاعدة البيانات تتعلق بهذا السؤال.**

**قدم إجابة من معرفتك العامة:**
1. ✅ أجب على السؤال بناءً على معرفتك العامة في صيانة المركبات
2. 📢 وضّح بوضوح أن هذه الإجابة من المعرفة العامة وليست من كراسة فنية محددة
3. 💼 انصح المستخدم بالرجوع للكراسة الفنية الخاصة بالمركبة للحصول على معلومات دقيقة
4. 📁 اقترح رفع الكراسة الفنية ذات الصلة إلى النظام

**تنسيق الإجابة:**

### 🤖 إجابة من المعرفة العامة:
[إجابة مفيدة ومفصلة]

### ⚠️ تنبيه مهم:
هذه المعلومات عامة. للحصول على إرشادات دقيقة ومحددة لمركبتك، يُرجى:
- 📖 الرجوع للكراسة الفنية الخاصة بالمركبة
- 📤 رفع الكراسة الفنية إلى النظام للحصول على إجابات أكثر دقة
`}

**قواعد عامة للإجابة:**
- ✅ **الإجابة بالعربية 100%** - لا تضع نصوص إنجليزية في الإجابة النهائية
- ✅ **ترجم جميع المصطلحات الفنية** مع ذكر المصطلح الإنجليزي بين قوسين عند الحاجة
- ✅ **استخدم رموز تعبيرية** لتحسين القراءة (🔧 ⚙️ ✅ ⚠️ 💡 📖 🔍 📋)
- ✅ **كن دقيقاً ومحدداً** - لا تعطِ معلومات عامة إذا كانت التفاصيل متوفرة
- ✅ **نظّم الإجابة بشكل احترافي** مع عناوين واضحة
- ✅ **أضف قيمة للمستخدم** - لا تكرر السؤال فقط

**ابدأ الإجابة الآن:**`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const answer = response.text();

            // Build citations from context
            const citations = this.buildCitations(context);

            return {
                answer: answer.trim(),
                citations,
                confidence: 0.9
            };
        } catch (error) {
            console.error('Gemini API Error:', error);
            // Fallback to basic response
            return this.generateBasicResponse(query, context);
        }
    }

    /**
     * Build context text from database results
     */
    private buildContextText(context: any): string {
        let text = '';

        if (context.manuals.length > 0) {
            text += '📖 **الكراسات الفنية المتوفرة:**\n';
            context.manuals.forEach((m: any, i: number) => {
                text += `\n${i + 1}. **${m.title}**\n`;
                if (m.vehicle_type) text += `   🚗 نوع المركبة: ${m.vehicle_type}\n`;
                if (m.description) text += `   📝 الوصف: ${m.description}\n`;
                if (m.content_preview) {
                    text += `   📄 المحتوى:\n`;
                    text += `   ${m.content_preview}\n`;
                }
                text += '\n';
            });
        }

        if (context.faults.length > 0) {
            text += '**الأعطال المسجلة:**\n';
            context.faults.forEach((f: any, i: number) => {
                text += `${i + 1}. ${f.title}\n`;
                if (f.description) text += `   الوصف: ${f.description}\n`;
                if (f.status) text += `   الحالة: ${f.status}\n`;
                text += '\n';
            });
        }

        if (context.vehicles.length > 0) {
            text += '**المركبات ذات الصلة:**\n';
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

        // Add manual citations
        context.manuals.forEach((m: any) => {
            const snippet = m.content_preview
                ? m.content_preview.substring(0, 100).trim() + '...'
                : (m.description ? m.description.substring(0, 100) + '...' : 'ملف فني بصيغة PDF');

            citations.push({
                doc_title: m.title,
                doc_id: m.id,
                snippet,
                link: `/uploads/manuals/${m.file_path.split(/[\\/]/).pop()}`,
                type: 'manual'
            });
        });

        // Add fault citations
        context.faults.forEach((f: any) => {
            citations.push({
                doc_title: `عطل: ${f.title}`,
                doc_id: f.id,
                snippet: f.description ? f.description.substring(0, 80) + '...' : '',
                link: `/diagnosis/common/${f.id}`,
                type: 'fault'
            });
        });

        // Add vehicle citations (limit to avoid clutter)
        if (citations.length < 6) {
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
     * Extract keywords from query
     */
    private extractKeywords(query: string): string[] {
        // Common stop words to filter out (Arabic and English)
        const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'هو', 'هي', 'the', 'is', 'in', 'on', 'at', 'to', 'a', 'an', 'كيف', 'ماذا', 'what', 'how', 'ما', 'هل'];

        // Technical term mappings (English <-> Arabic)
        const termMappings: { [key: string]: string[] } = {
            'engine': ['محرك', 'موتور', 'motor'],
            'محرك': ['engine', 'motor'],
            'brake': ['فرامل', 'فرملة', 'brakes'],
            'فرامل': ['brake', 'brakes'],
            'transmission': ['ناقل', 'جير', 'gearbox'],
            'ناقل': ['transmission', 'gearbox'],
            'oil': ['زيت', 'زيوت'],
            'زيت': ['oil'],
            'maintenance': ['صيانة', 'service'],
            'صيانة': ['maintenance', 'service'],
            'repair': ['إصلاح', 'تصليح'],
            'إصلاح': ['repair', 'fix'],
            'cooling': ['تبريد', 'radiator'],
            'تبريد': ['cooling', 'radiator']
        };

        const baseKeywords = query
            .toLowerCase()
            .split(/[\s,،.؟?!]+/)
            .filter(word => word.length > 2)
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
     * Search manuals in database
     */
    private async searchManuals(pool: any, keywords: string[], vehicleId?: string) {
        if (keywords.length === 0) return [];

        const conditions: string[] = [];
        const params: string[] = [];
        let paramIndex = 1;

        keywords.forEach(keyword => {
            if (keyword.length > 2) {
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

        const query = `
            SELECT id, title, description, file_path, vehicle_type, 
                   SUBSTRING(COALESCE(content, ''), 1, 5000) as content_preview
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
