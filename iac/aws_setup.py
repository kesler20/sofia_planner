"""
AWS Textract AnalyzeExpense Setup Script
Sets up IAM roles, S3 bucket, and required permissions for Textract
"""

import json
import sys
import typing
from enum import Enum

import boto3  # type: ignore
from botocore.exceptions import ClientError  # type: ignore
from dotenv import load_dotenv  # type: ignore
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings  # type: ignore


load_dotenv()


# =========================#
#                          #
#   Enums & Status Codes   #
#                          #
# =========================#


class SetupStatus(Enum):
    SUCCESS = "success"
    ALREADY_EXISTS = "already_exists"
    FAILED = "failed"


# =========================#
#                          #
#   Data Classes           #
#                          #
# =========================#


class TextractConfig(BaseSettings):
    """Configuration for Textract setup loaded from environment variables."""

    aws_access_key_id: str = Field(alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field(alias="AWS_SECRET_ACCESS_KEY")
    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    bucket_name: typing.Optional[str] = Field(
        default=None, alias="TEXTRACT_BUCKET_NAME"
    )
    role_name: str = Field(
        default="TextractExpenseAnalysisRole", alias="TEXTRACT_ROLE_NAME"
    )
    user_name: str = Field(default="textract-user", alias="TEXTRACT_USER_NAME")
    policy_name: str = Field(
        default="TextractExpensePolicy", alias="TEXTRACT_POLICY_NAME"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_bucket_name(self, account_id: str) -> str:
        if self.bucket_name:
            return self.bucket_name
        return f"textract-expenses-{account_id}"


class AWSCredentials(BaseModel):
    """AWS credentials data class for newly created user."""

    access_key_id: str
    secret_access_key: str
    region: str
    bucket_name: str

    def save_to_file(self, filepath: str) -> None:
        print(f"Saving credentials to {filepath}...")
        with open(filepath, "w") as f:
            json.dump(
                {
                    "AccessKeyId": self.access_key_id,
                    "SecretAccessKey": self.secret_access_key,
                    "Region": self.region,
                    "BucketName": self.bucket_name,
                },
                f,
                indent=2,
            )
        print(f"✓ Credentials saved to {filepath}")


class SetupResult(BaseModel):
    """Result of a setup operation."""

    status: SetupStatus
    message: str
    resource_name: typing.Optional[str] = None

    def is_successful(self) -> bool:
        return self.status in (SetupStatus.SUCCESS, SetupStatus.ALREADY_EXISTS)

    def print_result(self) -> None:
        symbol = "✓" if self.is_successful() else "✗"
        print(f"{symbol} {self.message}")


class SetupSummary(BaseModel):
    """Summary of the complete setup."""

    region: str
    bucket_name: str
    user_name: str
    role_name: str
    credentials_file: str = "textract_credentials.json"

    def print_summary(self) -> None:
        print("\n" + "=" * 60)
        print("✓ Setup Complete!")
        print("=" * 60)
        print(f"\nConfiguration Summary:")
        print(f"  Region: {self.region}")
        print(f"  S3 Bucket: {self.bucket_name}")
        print(f"  IAM User: {self.user_name}")
        print(f"  IAM Role: {self.role_name}")
        print(f"\nNext Steps:")
        print(f"  1. Use the credentials from {self.credentials_file}")
        print(f"  2. Configure AWS CLI: aws configure --profile textract")
        print(f"  3. Upload receipts to: s3://{self.bucket_name}/receipts/")
        print(f"  4. Run the TypeScript workflow\n")


# =========================#
#                          #
#   Adapter                #
#                          #
# =========================#


class S3Adapter:
    """Adapter for S3 bucket operations."""

    def __init__(self, region: str, access_key_id: str, secret_access_key: str):
        self._region = region
        self._client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
        )

    def create_bucket(self, bucket_name: str) -> SetupResult:
        try:
            print(f"Creating S3 bucket: {bucket_name}...")
            if self._region == "us-east-1":
                self._client.create_bucket(Bucket=bucket_name)
            else:
                self._client.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={"LocationConstraint": self._region},
                )
            return SetupResult(
                status=SetupStatus.SUCCESS,
                message=f"Created S3 bucket: {bucket_name}",
                resource_name=bucket_name,
            )
        except ClientError as e:
            bucket_already_exists = (
                e.response["Error"]["Code"] == "BucketAlreadyOwnedByYou"
            )
            if bucket_already_exists:
                return SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message=f"S3 bucket already exists: {bucket_name}",
                    resource_name=bucket_name,
                )
            return SetupResult(
                status=SetupStatus.FAILED,
                message=f"Error creating S3 bucket: {e}",
            )

    def create_folders(
        self, bucket_name: str, folders: typing.List[str]
    ) -> SetupResult:
        try:
            print(f"Creating S3 folders: {folders}...")
            for folder in folders:
                folder_key = folder if folder.endswith("/") else f"{folder}/"
                self._client.put_object(Bucket=bucket_name, Key=folder_key)
            return SetupResult(
                status=SetupStatus.SUCCESS,
                message=f"Created S3 folders: {', '.join(folders)}",
            )
        except ClientError as e:
            return SetupResult(
                status=SetupStatus.FAILED,
                message=f"Error creating S3 folders: {e}",
            )


# =========================#
#                          #
#   Business Rules         #
#                          #
# =========================#


def build_assume_role_policy(account_id: str) -> dict:
    """Build the assume role policy document for Textract."""
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "textract.amazonaws.com",
                    "AWS": f"arn:aws:iam::{account_id}:root",
                },
                "Action": "sts:AssumeRole",
            }
        ],
    }


def build_textract_policy(bucket_name: str) -> dict:
    """Build the IAM policy document for Textract and S3 access."""
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "textract:AnalyzeExpense",
                    "textract:StartExpenseAnalysis",
                    "textract:GetExpenseAnalysis",
                    "textract:AnalyzeDocument",
                    "textract:DetectDocumentText",
                ],
                "Resource": "*",
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket",
                ],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/*",
                ],
            },
        ],
    }


def build_policy_arn(account_id: str, policy_name: str) -> str:
    """Build the ARN for an IAM policy."""
    return f"arn:aws:iam::{account_id}:policy/{policy_name}"


# =========================#
#                          #
#   Use Cases              #
#                          #
# =========================#


class CreateS3BucketUseCase:
    """Use case for creating an S3 bucket with required folders."""

    def __init__(self, s3_adapter: S3Adapter):
        self._s3_adapter = s3_adapter

    def execute(self, bucket_name: str) -> SetupResult:
        bucket_result = self._s3_adapter.create_bucket(bucket_name)
        bucket_result.print_result()

        if not bucket_result.is_successful():
            return bucket_result

        folders_result = self._s3_adapter.create_folders(
            bucket_name, ["receipts", "results"]
        )
        folders_result.print_result()

        return folders_result


class CreateIAMRoleUseCase:
    """Use case for creating an IAM role with Textract permissions."""

    def __init__(self, iam_client, sts_client):
        self._iam_client = iam_client
        self._sts_client = sts_client

    def execute(self, role_name: str) -> SetupResult:
        try:
            print(f"Creating IAM role: {role_name}...")
            account_id = self._sts_client.get_caller_identity()["Account"]
            assume_role_policy = build_assume_role_policy(account_id)
            self._iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(assume_role_policy),
                Description="Role for Textract AnalyzeExpense operations",
            )
            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message=f"Created IAM role: {role_name}",
                resource_name=role_name,
            )
        except ClientError as e:
            role_already_exists = e.response["Error"]["Code"] == "EntityAlreadyExists"
            if role_already_exists:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message=f"IAM role already exists: {role_name}",
                    resource_name=role_name,
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error creating IAM role: {e}",
                )

        result.print_result()
        return result


class CreateIAMPolicyUseCase:
    """Use case for creating an IAM policy for Textract operations."""

    def __init__(self, iam_client):
        self._iam_client = iam_client

    def execute(self, policy_name: str, bucket_name: str) -> SetupResult:
        try:
            print(f"Creating IAM policy: {policy_name}...")
            policy_document = build_textract_policy(bucket_name)
            self._iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document),
                Description="Policy for Textract AnalyzeExpense operations",
            )
            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message=f"Created IAM policy: {policy_name}",
                resource_name=policy_name,
            )
        except ClientError as e:
            policy_already_exists = e.response["Error"]["Code"] == "EntityAlreadyExists"
            if policy_already_exists:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message=f"IAM policy already exists: {policy_name}",
                    resource_name=policy_name,
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error creating IAM policy: {e}",
                )

        result.print_result()
        return result


class AttachPolicyToRoleUseCase:
    """Use case for attaching a policy to a role."""

    def __init__(self, iam_client, sts_client):
        self._iam_client = iam_client
        self._sts_client = sts_client

    def execute(self, role_name: str, policy_name: str) -> SetupResult:
        try:
            print(f"Attaching policy to role: {role_name}...")
            account_id = self._sts_client.get_caller_identity()["Account"]
            policy_arn = build_policy_arn(account_id, policy_name)
            self._iam_client.attach_role_policy(
                RoleName=role_name, PolicyArn=policy_arn
            )
            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message="Attached policy to role",
            )
        except ClientError as e:
            error_is_acceptable = "NoSuchEntity" in str(
                e
            ) or "EntityAlreadyExists" in str(e)
            if error_is_acceptable:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message="Policy already attached to role",
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error attaching policy to role: {e}",
                )

        result.print_result()
        return result


class CreateIAMUserUseCase:
    """Use case for creating an IAM user."""

    def __init__(self, iam_client):
        self._iam_client = iam_client

    def execute(self, user_name: str) -> SetupResult:
        try:
            print(f"Creating IAM user: {user_name}...")
            self._iam_client.create_user(UserName=user_name)
            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message=f"Created IAM user: {user_name}",
                resource_name=user_name,
            )
        except ClientError as e:
            user_already_exists = e.response["Error"]["Code"] == "EntityAlreadyExists"
            if user_already_exists:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message=f"IAM user already exists: {user_name}",
                    resource_name=user_name,
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error creating IAM user: {e}",
                )

        result.print_result()
        return result


class AttachPolicyToUserUseCase:
    """Use case for attaching a policy to a user."""

    def __init__(self, iam_client, sts_client):
        self._iam_client = iam_client
        self._sts_client = sts_client

    def execute(self, user_name: str, policy_name: str) -> SetupResult:
        try:
            print(f"Attaching policy to user: {user_name}...")
            account_id = self._sts_client.get_caller_identity()["Account"]
            policy_arn = build_policy_arn(account_id, policy_name)
            self._iam_client.attach_user_policy(
                UserName=user_name, PolicyArn=policy_arn
            )
            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message="Attached policy to user",
            )
        except ClientError as e:
            error_is_acceptable = "NoSuchEntity" in str(
                e
            ) or "EntityAlreadyExists" in str(e)
            if error_is_acceptable:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message="Policy already attached to user",
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error attaching policy to user: {e}",
                )

        result.print_result()
        return result


class CreateAccessKeysUseCase:
    """Use case for creating and saving access keys."""

    def __init__(self, iam_client):
        self._iam_client = iam_client

    def execute(
        self, user_name: str, region: str, bucket_name: str
    ) -> typing.Tuple[SetupResult, typing.Optional[AWSCredentials]]:
        try:
            print(f"Creating access keys for user: {user_name}...")
            response = self._iam_client.create_access_key(UserName=user_name)
            access_key = response["AccessKey"]["AccessKeyId"]
            secret_key = response["AccessKey"]["SecretAccessKey"]

            self._print_credentials(access_key, secret_key)

            credentials = AWSCredentials(
                access_key_id=access_key,
                secret_access_key=secret_key,
                region=region,
                bucket_name=bucket_name,
            )
            credentials.save_to_file("textract_credentials.json")

            result = SetupResult(
                status=SetupStatus.SUCCESS,
                message="Created access keys for user",
            )
            result.print_result()
            return result, credentials

        except ClientError as e:
            limit_exceeded = "LimitExceeded" in str(e)
            if limit_exceeded:
                result = SetupResult(
                    status=SetupStatus.ALREADY_EXISTS,
                    message="User already has maximum access keys. Skipping key creation.",
                )
            else:
                result = SetupResult(
                    status=SetupStatus.FAILED,
                    message=f"Error creating access keys: {e}",
                )

            result.print_result()
            return result, None

    def _print_credentials(self, access_key_id: str, secret_access_key: str) -> None:
        print(f"\n{'=' * 60}")
        print(f"Access Key ID: {access_key_id}")
        print(f"Secret Access Key: {secret_access_key}")
        print(f"{'=' * 60}\n")
        print("⚠️  SAVE THESE CREDENTIALS SECURELY!")
        print("   They will not be shown again.\n")


class TextractSetupUseCase:
    """
    Orchestrates the complete Textract infrastructure setup.

    Parameters
    ----------
    config : TextractConfig
        Configuration for the setup loaded from environment variables.

    Examples
    --------
    >>> config = TextractConfig()
    >>> use_case = TextractSetupUseCase(config)
    >>> success = use_case.execute()
    """

    def __init__(self, config: TextractConfig):
        self._config = config
        self._iam_client = boto3.client(
            "iam",
            region_name=config.aws_region,
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key,
        )
        self._sts_client = boto3.client(
            "sts",
            region_name=config.aws_region,
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key,
        )
        self._s3_adapter = S3Adapter(
            config.aws_region,
            config.aws_access_key_id,
            config.aws_secret_access_key,
        )
        self._account_id = self._sts_client.get_caller_identity()["Account"]
        self._bucket_name = config.get_bucket_name(self._account_id)

    def execute(self) -> bool:
        """
        Execute the complete setup.

        Returns
        -------
        bool
            True if setup completed successfully, False otherwise.

        Side Effects
        ------------
        Creates AWS resources: S3 bucket, IAM role, IAM policy, IAM user, and access keys.
        Saves credentials to textract_credentials.json file.
        """
        self._print_header()

        steps = [
            self._create_s3_bucket,
            self._create_iam_role,
            self._create_iam_policy,
            self._attach_policy_to_role,
            self._create_iam_user,
            self._attach_policy_to_user,
            self._create_access_keys,
        ]

        for step in steps:
            result = step()
            if not result.is_successful():
                print(f"Setup failed at: {step.__name__}")
                return False

        self._print_summary()
        return True

    def _print_header(self) -> None:
        print("\n" + "=" * 60)
        print("AWS Textract AnalyzeExpense Setup")
        print("=" * 60 + "\n")

    def _print_summary(self) -> None:
        summary = SetupSummary(
            region=self._config.aws_region,
            bucket_name=self._bucket_name,
            user_name=self._config.user_name,
            role_name=self._config.role_name,
        )
        summary.print_summary()

    def _create_s3_bucket(self) -> SetupResult:
        use_case = CreateS3BucketUseCase(self._s3_adapter)
        return use_case.execute(self._bucket_name)

    def _create_iam_role(self) -> SetupResult:
        use_case = CreateIAMRoleUseCase(self._iam_client, self._sts_client)
        return use_case.execute(self._config.role_name)

    def _create_iam_policy(self) -> SetupResult:
        use_case = CreateIAMPolicyUseCase(self._iam_client)
        return use_case.execute(self._config.policy_name, self._bucket_name)

    def _attach_policy_to_role(self) -> SetupResult:
        use_case = AttachPolicyToRoleUseCase(self._iam_client, self._sts_client)
        return use_case.execute(self._config.role_name, self._config.policy_name)

    def _create_iam_user(self) -> SetupResult:
        use_case = CreateIAMUserUseCase(self._iam_client)
        return use_case.execute(self._config.user_name)

    def _attach_policy_to_user(self) -> SetupResult:
        use_case = AttachPolicyToUserUseCase(self._iam_client, self._sts_client)
        return use_case.execute(self._config.user_name, self._config.policy_name)

    def _create_access_keys(self) -> SetupResult:
        use_case = CreateAccessKeysUseCase(self._iam_client)
        result, _ = use_case.execute(
            self._config.user_name,
            self._config.aws_region,
            self._bucket_name,
        )
        return result


# =========================#
#                          #
#   Entry Point            #
#                          #
# =========================#


if __name__ == "__main__":
    config = TextractConfig()
    setup_use_case = TextractSetupUseCase(config)
    success = setup_use_case.execute()
    sys.exit(0 if success else 1)
