# Project Overview

This tool analyzes source code repositories and saves some data about the to a database, including the estimated cost
to create the project, and some statistics about the programming languages used.

It leverages a tool called [scc](https://github.com/boyter/scc) to gather the statistics about the codebase.

It was a simple proof of concept that graduated into a real tool, so please feel free to contribute and improve it.

## Getting started

This explains how to set up and run the software-value tool locally.
To run the tool on a production server, follow the Ansible instructions below.

### Requirements

- Go (latest stable version)
- PostgreSQL 14+
- [scc](https://github.com/boyter/scc) binary (path set in config)

The version of scc tested at this time was v3.5.0.
Using a different version may break this tool because the output format may have changed.

### Running the tool locally

1. Clone the repository and navigate to the project directory.

2. Install dependencies:
 `go mod download`

3. Create your configuration file:
   - Copy `config.toml.example` to `config.toml`.
   - Edit `config.toml` to set your database credentials, paths, and other settings.

4. Place the scc binary in the correct location:
   - Ensure the `scc` binary is in the path specified in your `config.toml` file.

5. Build and run the application: `go run ./`



## Deploying with Ansible

In the `ansible` directory, there is an Ansible playbook that can be used to deploy the tool automatically.
You can run it with the following command:

```bash
ansible-playbook -i inventory.ini playbook.yml
```

For this, you will need an `ansible/inventory.ini` file that specifies the target hosts and their SSH access details,
as well as an `ansible/group_vars/software_value.yaml` with the necessary variables for the config.toml template.

Here's an example of what your `inventory.ini` file might look like:

```ini
[software_value]
100.10.20.30 ansible_user=ubuntu
```

And these are the group variables that you need, with the variables replaced for your environment:

```yaml
db_insights_host: "10.10.10.10"
db_insights_port: 5432
db_insights_user: "lfx"
db_insights_password: "mightypassword"
db_insights_dbname: "lfx_insights_software_value"
db_insights_sslmode: "require"
db_insights_pool_max: 10
db_insights_readonly: false

db_cm_host: "10.20.30.40"
db_cm_port: 5432
db_cm_user: "cm"
db_cm_password: "passwordmight"
db_cm_dbname: "cm"
db_cm_sslmode: "require"
db_cm_pool_max: 10
db_cm_readonly: true

scc_path: "{{ svc_home }}/scc"
target_path: "/path/to/repositories"
batch_size: 100
```

If you modified the code and want to build an updated binary to be uploaded to the server, you can use:

```bash
go build -ldflags "-w" -o software-value ./ && strip software-value
````

## Running automatically

You should not need to do this.
These instructions are provided for just for completeness.
You should use the Ansible playbook to deploy the tool instead.

There are Systemd service and timer unit templates included in the `ansible/templates` directory.
The templates are named `lfx-software-value.service.j2` and `lfx-software-value.timer.j2`.
Make copies, rename them to `lfx-software-value.service` and `lfx-software-value.timer`, and edit them to replace the
variables with the correct values for your situation.
Finally, copy them to`/etc/systemd/system/` in the machine you want to run the tool,
and enable them with the following commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lfx-software-value.timer
```

Then start the timer with:

```bash
sudo systemctl start lfx-software-value.timer
```
