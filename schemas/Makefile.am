%.gschema.xml: %.gschema.xml.in
	$(MSGFMT) --xml -d $(top_srcdir)/po --template $< -o $@

schemasdir = $(datadir)/glib-2.0/schemas/
dist_schemas_DATA = $(PACKAGE).gschema.xml

localinstall: $(PACKAGE).gschema.xml
	$(MKDIR_P) "$(DESTDIR)/$(localprefix)/$(uuid)/schemas"; \
	cp $< "$(DESTDIR)/$(localprefix)/$(uuid)/schemas"; \
	glib-compile-schemas "$(DESTDIR)/$(localprefix)/$(uuid)/schemas"

EXTRA_DIST = $(PACKAGE).gschema.xml.in
