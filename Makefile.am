EXTRA_DIST = LICENSE README.md

SUBDIRS = src po schemas

# zip-file: all
# 	rm -rf $(builddir)/{_build,_install,$(PACKAGE).zip}; \
# 	$(MKDIR_P) $(builddir)/_build; \
# 	cp -r $(srcdir){/src/*.{js,json,css},/schemas} $(builddir)/_build; \
# 	(cd "$(builddir)/_build/"; \
# 	zip -qr "$(abs_top_builddir)/$(PACKAGE).zip" .; \
# 	); \
# 	rm -rf $(builddir)/{_build,_install};

# localinstall: zip-file
# 	zip_file="$(abs_top_builddir)/$(PACKAGE).zip"; \
# 	if [ -d "$(localprefix)/$(uuid)" ]; then \
# 		rm -fR "$(localprefix)/$(uuid)"; \
# 	fi; \
# 	$(MKDIR_P) $(localprefix)/$(uuid); \
# 	(cd $(localprefix)/$(uuid); \
# 		unzip -q $${zip_file}; \
# 		glib-compile-schemas schemas; \
# 	);

localinstall:
	$(MAKE) $(AM_MAKEFLAGS) -C src localinstall DESTDIR="$(DESTDIR)"; \
	$(MAKE) $(AM_MAKEFLAGS) -C schemas localinstall DESTDIR="$(DESTDIR)"; \
	extension_dir="$(DESTDIR)/$(localprefix)/$(uuid)"; \
	$(MKDIR_P) "$${extension_dir}/locale"; \
	$(MKDIR_P) "$${extension_dir}/_temp/$(datadir)"; \
	ln -s "$${extension_dir}/locale" "$${extension_dir}/_temp/$(datadir)/locale"; \
	$(MAKE) $(AM_MAKEFLAGS) -C po install DESTDIR="$${extension_dir}/_temp"; \
	rm -rf "$${extension_dir}/_temp"

zip-file:
	rm -rf "$(builddir)"/{_install,$(PACKAGE).zip}; \
	$(MKDIR_P) "$(builddir)/_install"; \
	$(MAKE) $(AM_MAKEFLAGS) localinstall localprefix=/ DESTDIR="$(abs_top_builddir)/_install"; \
	(cd "$(builddir)/_install/$(uuid)"; \
	zip -r "$(abs_top_builddir)/$(PACKAGE).zip" .; \
	); \
	rm -rf "$(builddir)/_install";

ACLOCAL_AMFLAGS = -I m4
