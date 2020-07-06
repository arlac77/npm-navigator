
post_install() {
	(cd {{installdir}}; gzip -k -9 *.html *.css *.mjs *.json *.map *.svg)
	systemctl reload nginx
}

pre_upgrade() {
	(cd {{installdir}}; rm *.gz)
}

post_upgrade() {
	(cd {{installdir}}; gzip -k -9 *.html *.css *.mjs *.json *.map *.svg)
	systemctl reload nginx
}

pre_remove() {
	(cd {{installdir}}; rm *.gz)
}

post_remove() {
	systemctl reload nginx
}
