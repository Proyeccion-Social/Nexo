import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ESTUDIANTE = 'ESTUDIANTE',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

@Entity('users')
@Unique('uq_users_email', ['email'])
@Unique('uq_users_nickname', ['nickname'])
@Unique('uq_users_student_code', ['studentCode'])
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 30 })
  nickname!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'student_code', type: 'varchar', length: 11 })
  studentCode!: string;

  @Column({ name: 'entry_semester', type: 'varchar', length: 6 })
  entrySemester!: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.ESTUDIANTE })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
