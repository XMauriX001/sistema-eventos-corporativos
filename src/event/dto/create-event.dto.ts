import { IsString, IsDateString, IsInt, Min, IsNumber, IsPositive, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Congreso Anual' })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty({ example: '2026-10-15T09:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Hotel Sheraton' })
  @IsString()
  @MaxLength(255)
  location: string;

  @ApiProperty({ example: 300, description: 'Límite de personas permitidas' })
  @IsInt()
  @Min(1)
  maxCapacity: number;

  @ApiProperty({ example: 25000.50, description: 'Presupuesto total aprobado' })
  @IsNumber()
  @IsPositive()
  approvedBudget: number;
}