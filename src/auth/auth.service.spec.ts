import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      const user = { email: 'test@test.com', password: 'hashedPassword', role: 'Admin' };
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.register({ email: 'test@test.com', password: 'pass', role: 'Admin' });
      expect(result).toEqual({ message: 'Usuario registrado exitosamente', email: 'test@test.com' });
    });

    it('debería lanzar ConflictException si el correo existe', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1', email: 'test@test.com' });
      await expect(service.register({ email: 'test@test.com', password: 'pass', role: 'Admin' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('debería iniciar sesión y retornar un token', async () => {
      const user = { id: '1', email: 'test@test.com', password: 'hashedPassword', role: 'Admin' };
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('fake_token');

      const result = await service.login({ email: 'test@test.com', password: 'pass' });
      expect(result).toEqual({ access_token: 'fake_token' });
    });

    it('debería lanzar UnauthorizedException con credenciales inválidas', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'fail@test.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});