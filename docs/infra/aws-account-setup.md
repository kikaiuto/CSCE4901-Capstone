# AWS account setup

How the Sector 7 AI account was created, how the five of us sign in, and
where secrets live. Follow this once for the account, then once per person.

The design has three rules. Nobody uses the root user after the first hour.
Nobody has long-lived access keys. Nothing secret is committed.

## 1. Create the account

Do this from one laptop, in a private browser window.

1. Go to <https://portal.aws.amazon.com/billing/signup>.
2. Email: use a shared mailbox or a plus alias you control, not a personal
   university address that expires at graduation. Example:
   `sector7-aws@<domain>` or `<you>+aws-root@proton.me`. The root email is
   the recovery path for the whole account, so it has to outlive the course.
3. Account name: `sector7-ai`.
4. Root password: generate a 30+ character one in a password manager. Store it
   in a shared vault entry (see section 5). Do not reuse it anywhere.
5. Finish the payment and phone verification. Pick the Basic support plan.

After sign-in, before anything else, as root:

6. **Enable MFA on root.** IAM → My security credentials → Assign MFA device.
   Use a FIDO2 key if someone has one, otherwise an authenticator app whose
   seed is also stored in the shared vault.
7. **Confirm root has no access keys.** Same page, "Access keys" section
   must be empty. Never create one.
8. **Set a budget.** Billing → Budgets → Create budget → Cost budget, $50
   monthly, alerts at 50% and 100%, sent to the shared email. This is the only
   thing standing between a leaked key and a four-figure bill.
9. **Enable IAM user and role access to billing.** Account → IAM user and role
   access to billing information → Edit → Activate. Without this, the admins
   you create next cannot see the bill.
10. Note the 12-digit account id (top right). You will need it below.

Sign out of root. From here on, root is only for billing disputes or account
closure.

## 2. Turn on IAM Identity Center

Identity Center is the AWS single sign-on service. It gives each person a
username, a password, and MFA, and issues short-lived credentials to the CLI.
This is how the four admins connect, instead of IAM users with access keys.

As root, one time:

1. Choose a home region and stay in it for everything. This runbook assumes
   `us-east-1`.
2. Console → IAM Identity Center → Enable. Pick "Enable with AWS Organizations"
   when asked. Organizations is free and lets us add a separate `staging`
   account later without a second signup.
3. Settings → Identity source: keep "Identity Center directory".
4. Settings → Authentication → MFA: set "Every time they sign in" and
   "Require them to register an MFA device at sign in".
5. Settings → Identity source → Actions → Customize AWS access portal URL.
   Set it to `sector7-ai`. The portal becomes
   `https://sector7-ai.awsapps.com/start`.

Now create the admin permission set and the group that holds it:

6. Permission sets → Create → Predefined → `AdministratorAccess`. Set session
   duration to 8 hours.
7. Groups → Create group → `admins`.
8. AWS accounts → select the management account → Assign users or groups →
   Groups → `admins` → Permission set `AdministratorAccess` → Submit.

Everything above can also be done from the CLI once one admin exists. The
console path is shown because the first admin has to be created by root.

## 3. Add the four teammates

Users → Add user, once per person:

| Field | Value |
| --- | --- |
| Username | first name, lowercase, no dots |
| Email | the address they read daily |
| Group | `admins` |

Identity Center emails each person an invitation. They set a password and
register MFA on first sign-in because step 2.4 forces it. Add yourself the
same way. Five users in `admins`, zero IAM users.

To remove someone at the end of the course, delete the user. Their sessions
die within the hour and no keys exist to rotate.

## 4. Connect from a laptop

Everyone, including you, works through the SSO flow. Nobody runs
`aws configure` with an access key.

```sh
aws configure sso
```

Answer the prompts:

```
SSO session name: sector7
SSO start URL: https://sector7-ai.awsapps.com/start
SSO region: us-east-1
SSO registration scopes: sso:account:access
```

A browser opens. Sign in, approve the device code, and the CLI lists the
account and the `AdministratorAccess` role. Accept the defaults and name the
profile `sector7`.

Put this in your shell profile so Terraform and the CLI pick it up:

```sh
export AWS_PROFILE=sector7
```

Daily use:

```sh
aws sso login
aws sts get-caller-identity
```

The second command should print an ARN containing
`AWSReservedSSO_AdministratorAccess`. Credentials expire after 8 hours and
`aws sso login` refreshes them. If a laptop is lost, delete the user in
Identity Center and that is the whole response.

## 5. Protect the secrets

There are three kinds of secret and each has exactly one home.

### Account secrets

Root password, root MFA seed, and the Identity Center portal URL live in a
shared password-manager vault. Bitwarden Organizations is free for two
people and cheap for five. Every admin has access to the vault. Nothing
about the account lives in Slack, Discord, email, or this repo.

### Application secrets

Everything in `.env.example` that is secret (`DATABASE_URL`, `REDIS_URL`,
`JWT_SECRET`) lives in **AWS Secrets Manager** once the stack is deployed.
The ECS task definition references the secret ARN and the container reads
it as an environment variable. The value never passes through Terraform
state, a CI log, or a developer laptop.

Naming convention, one secret per environment:

```
sector7/staging/database_url
sector7/staging/redis_url
sector7/staging/jwt_secret
sector7/prod/...
```

Create one from the CLI:

```sh
aws secretsmanager create-secret \
  --name sector7/staging/jwt_secret \
  --secret-string "$(openssl rand -base64 48)"
```

Non-secret config (`JWT_EXPIRY_MINUTES`, `LLM_PROVIDER`, `LLM_MODEL`,
`ENVIRONMENT`) goes in SSM Parameter Store as plain `String` parameters
under the same prefix. Secrets Manager costs per secret per month, Parameter
Store is free, so only genuinely secret values go in the paid one.

Local development keeps using `.env`, which `.gitignore` already excludes
along with `.env.*`.

### CI secrets

GitHub Actions never holds an AWS key. It assumes a role through OpenID
Connect: GitHub signs a token that says which repo and branch is running,
AWS trusts that token for one specific role, and the role's credentials last
an hour. There is nothing to leak and nothing to rotate.

The roles and the OIDC provider are the first real Terraform in this repo,
under `infra/terraform/bootstrap/`. There are two roles so a pull request can
never deploy:

| Role | Trusted subject | Can |
| --- | --- | --- |
| `sector7-github-actions` | `repo:kikaiuto/CSCE4901-Capstone:ref:refs/heads/main` | Read and write state, push images, update ECS |
| `sector7-github-actions-plan` | `repo:kikaiuto/CSCE4901-Capstone:pull_request` | Read state, `ReadOnlyAccess`, nothing else |

A PR workflow assumes the plan role and runs `terraform plan -lock=false`,
since it cannot write the lock file. Only a push to `main` assumes the deploy
role. A fork's token carries the fork's repo name and matches neither.

In the workflow, the only thing that changes is:

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::<account-id>:role/sector7-github-actions
      aws-region: us-east-1
```

The account id is not a secret, but keep it in a repository variable
(`AWS_ACCOUNT_ID`) rather than in the file so the workflow reads the same
across forks.

### Terraform state

State contains every resource id and some outputs, so it is treated as
sensitive even though it is not a credential. It lives in a private,
versioned, encrypted S3 bucket named `sector7-tfstate-<account-id>` with the
S3 native lock file (`use_lockfile = true`, which the pinned Terraform 1.16
supports, so no DynamoDB table is needed). `*.tfstate` and `*.tfvars` are
already gitignored.

The bootstrap is the one exception: it creates the bucket, so it cannot store
its own state there. One admin applies it from a laptop after `aws sso login`,
and its small local `terraform.tfstate` is gitignored and backed up to the
shared vault.

```sh
cd infra/terraform/bootstrap
terraform init
terraform apply
terraform output backend_config
```

The last command prints the `backend "s3"` block to paste into each
`envs/<env>/` configuration. `terraform output github_actions_role_arn` is the
`role-to-assume` for the deploy workflow, and
`terraform output github_actions_plan_role_arn` is the one for PR plans.

## 6. Guard rails that catch mistakes

Do these in the first week, before anyone writes a deploy pipeline.

- **Pre-commit secret scan.** Install `gitleaks` and add it as a pre-commit
  hook. It blocks a commit containing an AWS key, a JWT secret, or a
  connection string with a password in it. Run `gitleaks detect` once over
  the existing history too.
- **CloudTrail.** Identity Center with Organizations turns on a management
  events trail by default. Confirm in CloudTrail → Event history that
  sign-ins appear. Leave it on.
- **IAM Access Analyzer.** IAM → Access Analyzer → Create analyzer, account
  scope. It flags any bucket, role, or secret that becomes public or
  cross-account by accident.
- **Budget alert is wired to a mailbox someone reads.** Check it once by
  lowering the threshold to $1 and waiting for the email.
- **No `AdministratorAccess` in CI.** The GitHub role gets a scoped policy
  covering ECS, RDS, ElastiCache, S3, Secrets Manager read, and CloudWatch,
  not admin. Humans are admins, pipelines are not.

## Checklist

- [ ] Account created with a durable root email
- [ ] Root MFA on, root access keys absent
- [ ] $50 budget with alerts to the shared mailbox
- [ ] Identity Center enabled, MFA required every sign-in
- [ ] `AdministratorAccess` permission set, `admins` group, five users
- [ ] Every admin has run `aws sso login` and `aws sts get-caller-identity`
- [ ] Root and MFA seed in the shared vault
- [ ] `gitleaks` pre-commit hook on every clone
- [ ] `infra/terraform/bootstrap/` applied: state bucket + GitHub OIDC role
- [ ] CloudTrail and Access Analyzer confirmed on
