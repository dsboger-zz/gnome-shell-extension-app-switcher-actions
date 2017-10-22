EXTRA_DIST = LICENSE README.md

SUBDIRS = src po schemas

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
	zip -qr "$(abs_top_builddir)/$(PACKAGE).zip" .; \
	); \
	rm -rf "$(builddir)/_install";

ACLOCAL_AMFLAGS = -I m4
