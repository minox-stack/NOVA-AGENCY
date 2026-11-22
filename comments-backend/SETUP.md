# تفعيل التعليقات — Comments setup

التعليقات تتخزّن في جدول Google Sheets تاعك. كل تعليق جديد يجي سطر في الجدول، وما يبانش في الموقع حتى تحط ✓ في خانة **Approved**.

## الخطوات (5 دقائق، مرة وحدة برك)

1. حل **https://sheets.new** (بحساب Google تاعك) وسمّي الجدول مثلاً `NOVA comments`.
2. من القائمة: **Extensions → Apps Script** (الإضافات → Apps Script).
3. امسح الكود اللي كاين، وحط بلاصتو كل محتوى الملف [`Code.gs`](Code.gs)، ومن بعد اضغط **Save** (💾).
4. فوق، اختار الدالة **`setup`** واضغط **▶ Run**:
   - يطلبلك تسمح (Review permissions) → اختار حسابك → **Advanced** → **Go to … (unsafe)** → **Allow**.
   - هذا عادي: السكريبت تاعك أنت، ويحتاج يكتب في الجدول ويبعثلك إيميل كي يجي تعليق.
5. **Deploy → New deployment** → النوع ⚙️ **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
   - اضغط **Deploy**.
6. انسخ **Web app URL** (يكمل بـ `/exec`) وابعثهولي، ولا حطّو في `script.js` في السطر:
   ```js
   const COMMENTS_API = '';
   ```

## لوحة التحكم — novadz.space/admin

من هنا تنشر/تخفي/تمسح التعليقات وتبدّل حالتك (متاح / مشغول) بلا ما تحل الجدول.

- **كلمة السر** ماهيش في الكود: Apps Script → ⚙️ **Project Settings** → **Script Properties** → `ADMIN_KEY` = كلمة السر تاعك (8 حروف على الأقل) → **Save script properties**.
- باش تبدّلها: بدّل القيمة تاع `ADMIN_KEY` واحفظ — كل الأجهزة اللي كانت داخلة تخرج وحدها.
- 10 محاولات غالطة → اللوحة تتسكّر 15 دقيقة.
- «تذكّرني» = تبقى داخل 30 يوم على هذاك الجهاز؛ بلاها = 12 ساعة.

## كيفاش توافق على تعليق من الجدول (إذا حبيت)

- حل الجدول → تبويب **Comments**.
- حط ✓ في خانة **Approved** → التعليق يبان في الموقع (في دقيقتين على الأكثر).
- نحّي ✓ ولا امسح السطر → التعليق يختفي.
- كل ما يجي تعليق جديد يوصلك إيميل فيه رابط الجدول.

## الحالة المباشرة: متاح ولا مشغول

- حل الجدول → تبويب **Status**.
- في الخانة **B1** اختار من القائمة: `Available — متاح` ولا `Busy — مشغول`.
- (اختياري) **B2** ملاحظة بالإنجليزية و**B3** بالعربية، مثلاً «نرجع يوم 5 ديسمبر» — تبان حدا الحالة في قسم التواصل. خليهم فارغين إذا ما تحتاجهمش.
- الموقع يتبدّل وحدو في دقيقتين على الأكثر (فوق في الشريط، وفي قسم التواصل).

## ملاحظات

- إذا صنعت السكريبت وحدو (https://script.new) وماشي من الجدول، حط ID تاع الجدول في `SHEET_ID` في أول `Code.gs` (الـ ID هو الجزء اللي بين `/d/` و`/edit` في رابط الجدول). هكذا راهو مركّب الآن.

- إذا بدّلت `Code.gs` من بعد، لازم **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** باش يتطبّق التبديل (الرابط يبقى نفسه).
- الحماية: خانة مخفية ضد الروبوتات، حد 30 تعليق في الدقيقة، والنص يتعرض في الموقع كنص عادي (ما يتنفّذش ككود).

---

**English (short):** create a Google Sheet → Extensions → Apps Script → paste `Code.gs` → run `setup` once and allow → Deploy as **Web app** (Execute as: Me, Access: Anyone) → put the `/exec` URL in `COMMENTS_API` in `script.js`. Tick **Approved** in the sheet to publish a comment. Live status: pick Available or Busy in cell **B1** of the **Status** tab (optional notes in B2 English / B3 Arabic); the site follows within 2 minutes. Dashboard: **novadz.space/admin** — set the password as the `ADMIN_KEY` script property (Project Settings → Script Properties); it is never stored in the code.
