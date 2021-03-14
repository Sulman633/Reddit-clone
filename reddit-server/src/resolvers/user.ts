import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from './../utils/validateRegister';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from './../constants';
import { User } from './../entities/User';
import { MyContext } from './../types';
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql';
import Argon2 from 'argon2';
import { UsernamePasswordInput } from '../utils/UsernamePasswordInput';
import { v4 } from 'uuid'
import { getConnection } from 'typeorm';





@ObjectType() 
class FieldError {
    @Field()
    field: string

    @Field()
    message: string
}


@ObjectType()
class UserResponse {
    @Field( () => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver() 
export class UserResolver {

    @Mutation(() => UserResponse)
    async changePassword (
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redisClient, req}: MyContext
    ): Promise<UserResponse> {

        if(newPassword.length < 3) {
            return {
                errors: [
                {
                    field: 'password',
                    message: "length must be greater than 3 for password"
                }]
            }
        }

        const key = FORGET_PASSWORD_PREFIX + token
        const userId = await redisClient.get(key);
        console.log('userId', userId)
        if(!userId) {
            return  {
                errors: [
                    {
                        field: 'token',
                        message: "token expired"
                    }]
            }
        }
        const userIdNum = parseInt(userId.toString())
        const user = await User.findOne(userIdNum)

        if (!user) {
            return  {
                errors: [
                    {
                        field: 'token',
                        message: "user does not exist"
                    }]
            }
        }

        await User.update({id: userIdNum}, {
            password: await Argon2.hash(newPassword)
        })
        await redisClient.del(key);

        // login user to app
        req.session.userId = user.id;
        
        return { user };
        
    }

    @Mutation(() => Boolean)
    async forgotPassword (
        @Arg('email') email: string,
        @Ctx() {redisClient}: MyContext
    ) {
        const user =  await User.findOne( { where: {email} });
        console.log('user', user, 'email', email)
        if(!user) {
            return true;
        }
        const token = v4();

        await redisClient.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3 ) // 3 days
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}"> change password</a>`);
        return true;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);

        if(errors) {
            return { errors };
        }

        const hashedPassword = await Argon2.hash(options.password)
        let user;
        
            try {
                //same as below bit with query builder
                // User.create({
                //     username: options.username,
                //     password: hashedPassword ,
                //     email: options.email
                // }).save()
                const result = await getConnection().createQueryBuilder().insert().into(User).values (
                    {
                        username: options.username,
                        password: hashedPassword ,
                        email: options.email
                    }  
                ).returning('*')
                .execute();

                user = result.raw[0];
            } 
            catch(err) {
                console.log('error code', err)
                if(err.code === '23505'){
                    return {
                        errors: [
                            {
                                field: "username",
                                message: "username is already taken"
                            }
                        ]
                    }
                }
            }
        //store user id session 
        // this will set a cookie on the user
        req.session.userId = user.id
       
        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(usernameOrEmail.includes("@") ? { where: { email: usernameOrEmail }} : { where: { username : usernameOrEmail }});
       
        if (!user) {
            return {
                errors: [{field: 'usernameOrEmail', message:'that username does not exist' }]
            }
        }

        const valid = await Argon2.verify(user.password, password)

        if(!valid) {
            return {
                errors: [{field: 'password', message:'incorrect password' }]
            }
        }
        req.session.userId = user.id;
    
        return {
            user
        };
    }

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() { req }: MyContext
    ) {
        
       if( !req.session.userId ) {
           return null;
       }

       return await User.findOne(req.session.userId);
       
    }

    @Mutation(() => Boolean)
     logout( @Ctx() { req, res }: MyContext) {
         
      return new Promise((resolve) => 
        req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME);
           if(err) {
               console.log(err)
               resolve(false)
               return
           }
           resolve(true);
       }))
    }
}