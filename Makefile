TARGET = "focusli@armonge.info.zip"

DIST_FILES = \
	extension.js		\
	manager.js 		\
	metadata.json		\
	sound.js		\
	sounds/database.json	\
	stylesheet.css		\
	$(NULL)

distcheck:
	zip -r $(TARGET) $(DIST_FILES)
