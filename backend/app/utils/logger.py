import logging
import sys

def get_logger(name: str = "app") -> logging.Logger:
    """
    Cria e retorna um logger configurado.
    O parâmetro `name` é opcional (default = "app").
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

# Instância global reutilizável
logger = get_logger()
