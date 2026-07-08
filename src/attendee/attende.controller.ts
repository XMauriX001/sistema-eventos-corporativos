import { Controller, Post, Param, ParseUUIDPipe, UseGuards, Body } from '@nestjs/common';
import { AttendeesService } from './attendee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Attendee')
@ApiBearerAuth()
@Controller('attendee')
export class AttendeeController {
  constructor(private readonly attendeeService: AttendeesService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Inscribir un asistente a un evento' })
  register(@Body() registerDto: RegisterAttendeeDto) {
    return this.attendeeService.registerAttendee(registerDto.eventId, registerDto.email);
  }

  @Post('check-in/:qrCode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Organizador')
  @ApiOperation({ summary: 'Registrar la entrada de un asistente mediante su QR' })
  @ApiResponse({ status: 200, description: 'Check-in realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'El asistente ya realizó el check-in' })
  @ApiResponse({ status: 404, description: 'QR no encontrado' })
  checkIn(@Param('qrCode', ParseUUIDPipe) qrCode: string) {
    return this.attendeeService.checkIn(qrCode);
  }
}