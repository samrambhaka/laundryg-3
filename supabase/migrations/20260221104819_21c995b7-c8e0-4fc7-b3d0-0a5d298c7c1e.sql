-- Fix existing profile with missing data
UPDATE profiles 
SET name = 'Anas', mobile_number = '+919497589094' 
WHERE user_id = 'a3c741fd-737f-45a7-8a8e-4d43c4a865fa' AND (name = '' OR mobile_number IS NULL);