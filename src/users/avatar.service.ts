import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Principal } from '../common/types.js';
import { StorageService } from '../infrastructure/storage.service.js';
import { UsersRepository } from './users.repository.js';

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
export type UploadedImage = { buffer: Buffer; size: number };
export function detectImageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  return null;
}
@Injectable()
export class AvatarService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly storage: StorageService,
  ) {}
  authorize(principal: Principal, userId: string) {
    if (principal.role !== 'ADMIN' && principal.sub !== userId)
      throw new ForbiddenException('Only the owner or an administrator may modify this avatar');
  }
  async upload(principal: Principal, userId: string, file?: UploadedImage) {
    this.authorize(principal, userId);
    await this.requireActiveUser(userId);
    if (!file) throw new BadRequestException({ message: 'An image file is required', code: 'FILE_REQUIRED' });
    if (file.size > MAX_AVATAR_SIZE)
      throw new BadRequestException({ message: 'Image exceeds the 5 MiB limit', code: 'INVALID_IMAGE' });
    const mimeType = detectImageType(file.buffer);
    if (!mimeType)
      throw new BadRequestException({
        message: 'Only valid JPEG, PNG, or WebP images are accepted',
        code: 'INVALID_IMAGE',
      });
    const objectKey = `profiles/${userId}`;
    const stored = await this.storage.put(objectKey, file.buffer, mimeType);
    return this.repo.upsertImage(userId, {
      objectKey,
      mimeType,
      size: file.size,
      ...(stored.ETag && { etag: stored.ETag }),
    });
  }
  async download(userId: string) {
    await this.requireActiveUser(userId);
    const image = await this.repo.image(userId);
    if (!image) throw new NotFoundException('Profile image not found');
    return { image, object: await this.storage.get(image.objectKey) };
  }
  async remove(principal: Principal, userId: string): Promise<void> {
    this.authorize(principal, userId);
    const image = await this.repo.image(userId);
    if (!image) return;
    await this.storage.delete(image.objectKey);
    await this.repo.deleteImage(userId);
  }
  private async requireActiveUser(id: string) {
    const user = await this.repo.find(id);
    if (!user || user.status !== 'ACTIVE') throw new NotFoundException('User not found');
  }
}
