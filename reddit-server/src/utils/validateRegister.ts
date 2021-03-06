import { UsernamePasswordInput } from "./UsernamePasswordInput"

export const validateRegister = (options: UsernamePasswordInput) => {
    if(!options.email.includes('@')) {
        return  [
            {
                field: 'email',
                message: "invalid email"
            }
        ]
    }
    
    if(options.username.length < 2) {
        return  [
            {
                field: 'username',
                message: "length must be greater than 2 for username"
            }
        ]
    }

    if(options.password.length < 3) {
        return  [
            {
                field: 'password',
                message: "length must be greater than 3 for password"
            }
        ]
    }

    if(options.username.includes('@')) {
        return  [
            {
                field: 'username',
                message: "cannot include @ sign"
            }
        ]
    }
    return null;
}