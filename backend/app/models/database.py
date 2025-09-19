from supabase import create_client, Client
from app.core.config import settings

# =========================
# Conexão com Supabase
# =========================
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)


# =========================
# Funções de Banco de Dados
# =========================
def get_table(table_name: str):
    """
    Retorna a referência a uma tabela do Supabase.
    """
    return supabase.table(table_name)


def insert_row(table: str, data: dict):
    """
    Insere uma linha na tabela.
    """
    return supabase.table(table).insert(data).execute()


def fetch_rows(table: str, filters: dict = None):
    """
    Busca linhas da tabela com filtros opcionais.
    """
    query = supabase.table(table).select("*")
    if filters:
        for k, v in filters.items():
            query = query.eq(k, v)
    return query.execute()


def update_row(table: str, filters: dict, data: dict):
    """
    Atualiza linhas com base nos filtros.
    """
    query = supabase.table(table).update(data)
    for k, v in filters.items():
        query = query.eq(k, v)
    return query.execute()


def delete_row(table: str, filters: dict):
    """
    Deleta linhas com base nos filtros.
    """
    query = supabase.table(table).delete()
    for k, v in filters.items():
        query = query.eq(k, v)
    return query.execute()


# =========================
# Funções de Storage (S3 Supabase)
# =========================
def upload_file(bucket: str, file_path: str, file_bytes: bytes, content_type: str):
    """
    Upload de arquivo para bucket do Supabase (S3).
    """
    return supabase.storage.from_(bucket).upload(file_path, file_bytes, {"content-type": content_type})


def get_public_url(bucket: str, file_path: str) -> str:
    """
    Gera URL pública de um arquivo armazenado.
    """
    return supabase.storage.from_(bucket).get_public_url(file_path)


def delete_file(bucket: str, file_path: str):
    """
    Remove um arquivo do bucket.
    """
    return supabase.storage.from_(bucket).remove(file_path)
