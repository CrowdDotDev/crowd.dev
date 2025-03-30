# How to develop with Tinybird Forward

We now have an env `WITH_INSIGHTS` that enables sequin and tinybird on scaffold up.

`WITH_INSIGHTS=1 cli scaffold up` will install tb client for you if it's not installed yet. Also it will up a tinybird local container using the cli.

To get a hot reloading environment for the tinybird schema, in this folder run `tb dev`. This will also open an interactive command line that u can run tb commands against the local container.