-- New fq.PageErrorLocaleDefaults table: admin-managed, locale-keyed default
-- copy for the generated form's "page error" block (page_error[locale].hrErr
-- in the master data JS file), injected automatically at publish time
-- instead of being hand-edited into the generated file after every publish.
-- See app/models/page_error_locale_default.py and
-- form_builder_service.publish_form. Idempotent: safe to run any number of
-- times.
--
--   python scripts/run_sql_file.py scripts/page_error_locale_defaults_migration.sql

IF OBJECT_ID('fq.PageErrorLocaleDefaults', 'U') IS NULL
BEGIN
    CREATE TABLE fq.PageErrorLocaleDefaults (
        id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PageErrorLocaleDefaults PRIMARY KEY CONSTRAINT DF_PageErrorLocaleDefaults_id DEFAULT NEWID(),
        localeCode        NVARCHAR(20)     NOT NULL,
        heading           NVARCHAR(500)    NOT NULL,
        subHeading        NVARCHAR(1000)   NOT NULL,
        subHeadingUrl     NVARCHAR(1000)   NOT NULL,
        subHeadingUrlText NVARCHAR(200)    NOT NULL,
        createdAt         DATETIMEOFFSET   NOT NULL CONSTRAINT DF_PageErrorLocaleDefaults_createdAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_PageErrorLocaleDefaults_localeCode UNIQUE (localeCode)
    );
END
GO

-- Seed with the known regional defaults. Only inserts a locale that doesn't
-- already have a row, so it never overwrites anything an admin already set
-- by hand (Configuration > Access & Locales).
MERGE fq.PageErrorLocaleDefaults AS target
USING (VALUES
    (N'en_AE', N'Something went wrong.', N'Please try again later. In the meantime, discover about', N'https://www.samsung.com/ae/galaxy-ai/', N'Why Galaxy?'),
    (N'ar_AE', N'حدث خطأ ما.', N'يرجى المحاولة مرة أخرى لاحقًا. في هذه الأثناء، اكتشف المزيد على:', N'https://www.samsung.com/ae_ar/galaxy-ai/', N'لماذا Galaxy؟'),
    (N'tr_TR', N'Bir şeyler ters gitti!', N'Daha sonra tekrar deneyin. Bu sırada, daha fazlasını keşfedin:', N'https://www.samsung.com/tr/galaxy-ai/', N'Neden Galaxy?'),
    (N'he_IL', N'משהו השתבש.', N'אנא נסו שוב מאוחר יותר. בנתיים, תוכלו לגלות עוד על', N'https://www.samsung.com/il/galaxy-ai/', N'Why Galaxy?'),
    (N'en_JO', N'Something went wrong.', N'Please try again later. In the meantime, discover about', N'https://www.samsung.com/levant/why-samsung-account/', N'Why Galaxy?'),
    (N'en_LB', N'Something went wrong.', N'Please try again later. In the meantime, discover about', N'https://www.samsung.com/levant/why-samsung-account/', N'Why Galaxy?'),
    (N'ar_JO', N'حدث خطأ ما.', N'يرجى المحاولة مرة أخرى لاحقًا. في هذه الأثناء، اكتشف المزيد على:', N'https://www.samsung.com/levant_ar/why-samsung-account/', N'لماذا Galaxy؟'),
    (N'ar_IQ', N'حدث خطأ ما.', N'يرجى المحاولة مرة أخرى لاحقًا. في هذه الأثناء، اكتشف المزيد على:', N'https://www.samsung.com/levant_ar/why-samsung-account/', N'لماذا Galaxy؟'),
    (N'ku_IQ', N'هەڵەیەک ڕوویداوە.', N'تکایە کاتێکی تر هەوڵبدەوە. لە ئێستادا زیاتر بزانە لە:', N'https://www.samsung.com/iq_ku/why-samsung-account/', N'بۆچی Galaxy؟'),
    (N'fr_MA', N'Une erreur s''est produite.', N'Réessaie plus tard. En attendant, découvre sur', N'https://www.samsung.com/n_africa/galaxy-ai/', N'Pourquoi Galaxy ?'),
    (N'en_PK', N'Something went wrong.', N'Please try again later. In the meantime, discover about', N'https://www.samsung.com/pk/why-samsung-account/', N'Why Galaxy?'),
    (N'ar_SA', N'حدث خطأ ما.', N'يرجى المحاولة مرة أخرى لاحقًا. في هذه الأثناء، اكتشف المزيد على:', N'https://www.samsung.com/sa/galaxy-ai/', N'لماذا Galaxy؟')
) AS source (localeCode, heading, subHeading, subHeadingUrl, subHeadingUrlText)
ON target.localeCode = source.localeCode
WHEN NOT MATCHED THEN
    INSERT (localeCode, heading, subHeading, subHeadingUrl, subHeadingUrlText)
    VALUES (source.localeCode, source.heading, source.subHeading, source.subHeadingUrl, source.subHeadingUrlText);
GO

-- Verify
SELECT localeCode, heading, subHeadingUrl FROM fq.PageErrorLocaleDefaults ORDER BY localeCode;
GO
