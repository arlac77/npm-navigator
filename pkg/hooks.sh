
post_install() {
	(cd {{installdir}} && find -type f ! -name "*.gz" -print0|xargs -0 gzip -k -9)
	systemctl reload nginx
}

pre_upgrade() {
	(cd {{installdir}} && find -type f -name "*.gz" -print0|xargs -0 rm)
}

post_upgrade() {
	(cd {{installdir}} && find -type f ! -name "*.gz" -print0|xargs -0 gzip -k -9)
	systemctl reload nginx
}

pre_remove() {
	(cd {{installdir}} && find -type f -name "*.gz" -print0|xargs -0 rm)
}

post_remove() {
	systemctl reload nginx
}
