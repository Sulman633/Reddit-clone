import { Post } from './Post';
import { Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'


@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({unique: true})
  username!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[]

  @Field()
  @Column({ unique: true})
  email!: string;

  //not allowing you to select password in graphQL only used in database since no Field().
  @Column()
  password!: string;

}