import uuid
from supabase import create_client, Client
from fastapi import UploadFile
from app.core.config import settings


class StorageService:
    """
    Serviço para lidar com upload e recuperação de arquivos
    no Supabase Storage (S3 compatível).
    """

    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        self.bucket_name = settings.supabase_bucket

    async def upload_file(self, file: UploadFile, folder: str = "uploads") -> str:
        """
        Faz upload de um arquivo para o Supabase Storage e retorna a URL pública.
        """
        try:
            file_ext = file.filename.split(".")[-1]
            unique_name = f"{folder}/{uuid.uuid4()}.{file_ext}"
            content = await file.read()

            # Upload para Supabase
            self.client.storage.from_(self.bucket_name).upload(
                unique_name,
                content,
                {"content-type": file.content_type},
            )

            # Retorna URL pública
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(unique_name)
            return public_url

        except Exception as e:
            raise RuntimeError(f"Erro ao fazer upload do arquivo: {str(e)}")

    def get_public_url(self, path: str) -> str:
        """
        Retorna a URL pública de um arquivo já existente.
        """
        try:
            return self.client.storage.from_(self.bucket_name).get_public_url(path)
        except Exception as e:
            raise RuntimeError(f"Erro ao recuperar URL pública: {str(e)}")

    def delete_file(self, path: str) -> bool:
        """
        Remove um arquivo do Supabase Storage.
        """
        try:
            res = self.client.storage.from_(self.bucket_name).remove([path])
            return True if res else False
        except Exception as e:
            raise RuntimeError(f"Erro ao deletar arquivo: {str(e)}")
