import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

// Extend Request for req.user
interface AuthRequest extends Request {
  user: any; // Can be changed to User type if needed
}

@Controller('contacts')
@UseGuards(JwtAuthGuard) // Every Route needs JWT
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Store file
  private static photoStorage = diskStorage({
    destination: './uploads/contacts',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  // POST /contacts
  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: ContactsController.photoStorage,
    }),
  )
  create(
    @Req() req: AuthRequest,
    @Body() dto: CreateContactDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user;
    const photoFilename = file?.filename;
    return this.contactsService.create(user, dto, photoFilename);
  }

  // GET /contacts
  @Get()
  findAll(@Req() req: AuthRequest, @Query() query: QueryContactsDto) {
    const user = req.user;
    return this.contactsService.findAll(user, query);
  }

  // GET /contacts/:id
  @Get(':id')
  findOne(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user;
    return this.contactsService.findOne(user, id);
  }

  // PATCH /contacts/:id
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: ContactsController.photoStorage,
    }),
  )
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user;
    const photoFilename = file?.filename;
    return this.contactsService.update(user, id, dto, photoFilename);
  }

  // DELETE /contacts/:id
  @Delete(':id')
  remove(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user;
    return this.contactsService.remove(user, id);
  }
}
