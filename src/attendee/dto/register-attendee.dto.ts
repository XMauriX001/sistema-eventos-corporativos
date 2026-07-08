import { IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAttendeeDto {
  @ApiProperty({ example: 'juan-perez@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  eventId: string;
}