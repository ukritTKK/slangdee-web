CREATE TRIGGER "Slang_language_insert" BEFORE INSERT ON "Slang" WHEN NEW."originalLanguage" IS NOT NULL AND NEW."originalLanguage" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported original language'); END;
CREATE TRIGGER "Slang_language_update" BEFORE UPDATE OF "originalLanguage" ON "Slang" WHEN NEW."originalLanguage" IS NOT NULL AND NEW."originalLanguage" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported original language'); END;
CREATE TRIGGER "SlangTranslation_locale_insert" BEFORE INSERT ON "SlangTranslation" WHEN NEW."locale" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported translation locale'); END;
CREATE TRIGGER "SlangTranslation_locale_update" BEFORE UPDATE OF "locale" ON "SlangTranslation" WHEN NEW."locale" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported translation locale'); END;
CREATE TRIGGER "Example_locale_insert" BEFORE INSERT ON "Example" WHEN NEW."locale" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported example locale'); END;
CREATE TRIGGER "Example_locale_update" BEFORE UPDATE OF "locale" ON "Example" WHEN NEW."locale" NOT IN ('th', 'en') BEGIN SELECT RAISE(ABORT, 'Unsupported example locale'); END;
