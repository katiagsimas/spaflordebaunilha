UPDATE auth.users 
SET aud = 'authenticated', 
    is_super_admin = false,
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{"nome_completo":"Spa Flor de Baunilha"}'
WHERE email = 'katiagsimas@gmail.com';