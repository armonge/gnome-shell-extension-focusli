TARGET = "focusli@armonge.info.zip"

DIST_FILES = \
	icon.png 	\
	extension.js		\
	manager.js 		\
	metadata.json		\
	sound.js		\
	sounds/database.json	\
	sounds/*.ogg		\
	stylesheet.css		\
	$(NULL)

distcheck:
	zip -r $(TARGET) $(DIST_FILES)
