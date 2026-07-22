import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, Roles } from '../common/decorators.js';
import type { Principal } from '../common/types.js';
import { MAX_AVATAR_SIZE, AvatarService } from './avatar.service.js';
import type { UploadedImage } from './avatar.service.js';
import {
  ChangePasswordDto,
  CreateUserDto,
  IdParamDto,
  ListUsersDto,
  UpdateMeDto,
  UpdateUserDto,
} from './users.schemas.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly avatars: AvatarService,
  ) {}
  @Get('me') me(@CurrentUser() user: Principal) {
    return this.users.get(user.sub);
  }
  @Patch('me') updateMe(@CurrentUser() user: Principal, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.sub, dto);
  }
  @Patch('me/password') @HttpCode(204) password(@CurrentUser() user: Principal, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.sub, dto);
  }
  @Roles('ADMIN') @Get() list(@Query() query: ListUsersDto) {
    return this.users.list(query);
  }
  @Roles('ADMIN') @Post() create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }
  @Roles('ADMIN') @Get(':id') get(@Param() params: IdParamDto) {
    return this.users.get(params.id);
  }
  @Roles('ADMIN') @Patch(':id') update(
    @CurrentUser() actor: Principal,
    @Param() params: IdParamDto,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(actor.sub, params.id, dto);
  }
  @Roles('ADMIN') @Delete(':id') @HttpCode(204) remove(@CurrentUser() actor: Principal, @Param() params: IdParamDto) {
    return this.users.remove(actor.sub, params.id);
  }
  @Put(':id/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_SIZE } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
  })
  avatar(@CurrentUser() actor: Principal, @Param() params: IdParamDto, @UploadedFile() file?: UploadedImage) {
    return this.avatars.upload(actor, params.id, file);
  }
  @Get(':id/avatar') async avatarGet(@Param() params: IdParamDto, @Res() res: Response) {
    const result = await this.avatars.download(params.id);
    res.type(result.image.mimeType);
    res.setHeader('Content-Length', result.image.size);
    result.object.Body?.pipe(res);
  }
  @Delete(':id/avatar') @HttpCode(204) avatarDelete(@CurrentUser() actor: Principal, @Param() params: IdParamDto) {
    return this.avatars.remove(actor, params.id);
  }
}
