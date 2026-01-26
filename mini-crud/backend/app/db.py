import os
import pymysql

def get_conn():
        
    return pymysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3307")),
            user=os.getenv("DB_USER", "app"),
            password=os.getenv("DB_PASSWORD", "app1234"),
            database=os.getenv("DB_NAME", "appdb"),
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True,
        )

