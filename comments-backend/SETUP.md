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

## كيفاش توافق على تعليق

- حل الجدول → تبويب **Comments**.
- حط ✓ في خانة **Approved** → التعليق يبان في الموقع (في دقيقتين على الأكثر).
- نحّي ✓ ولا امسح السطر → التعليق يختفي.
- كل ما يجي تعليق جديد يوصلك إيميل فيه رابط الجدول.

## ملاحظات

- إذا بدّلت `Code.gs` من بعد، لازم **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** باش يتطبّق التبديل (الرابط يبقى نفسه).
- الحماية: خانة مخفية ضد الروبوتات، حد 30 تعليق في الدقيقة، والنص يتعرض في الموقع كنص عادي (ما يتنفّذش ككود).

---

**English (short):** create a Google Sheet → Extensions → Apps Script → paste `Code.gs` → run `setup` once and allow → Deploy as **Web app** (Execute as: Me, Access: Anyone) → put the `/exec` URL in `COMMENTS_API` in `script.js`. Tick **Approved** in the sheet to publish a comment.
