extensiondir = $(datadir)/gnome-shell/extensions/$(uuid)
dist_extension_DATA = $(srcdir)/*.js $(srcdir)/metadata.json $(srcdir)/stylesheet.css

localinstall:
	$(MKDIR_P) "$(DESTDIR)/$(localprefix)/$(uuid)"; \
	cp $(dist_extension_DATA) "$(DESTDIR)/$(localprefix)/$(uuid)"
