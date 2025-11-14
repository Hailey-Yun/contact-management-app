import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepo: Repository<Contact>,
  ) {}

  /** Check if user is admin */
  private isAdmin(user: User | any): boolean {
    return user?.role === Role.ADMIN || user?.role === 'admin';
  }

  /** Convert any value to boolean */
  private asBoolean(value: any): boolean {
    if (value === true) return true;
    if (value === 'true') return true;
    if (value === 1) return true;
    if (value === '1') return true;
    return false;
  }

  /** CREATE */
  async create(
    user: User | any,
    createContactDto: CreateContactDto,
    photoFilename?: string | null,
  ): Promise<Contact> {
    const contact = this.contactsRepo.create({
      ...createContactDto,
      owner: user,
    });

    contact.photo = photoFilename ?? null;

    return this.contactsRepo.save(contact);
  }

  /** READ - list with filters/pagination */
  async findAll(
    user: User | any,
    query: QueryContactsDto,
  ): Promise<{ data: Contact[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      all,
    } = query;

    const qb = this.contactsRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.owner', 'owner');

    const isAdmin = this.isAdmin(user);
    const fetchAll = isAdmin && this.asBoolean(all);

    // If not admin with all=true, only return contacts owned by the current user
    if (!fetchAll) {
      qb.where('owner.id = :ownerId', { ownerId: user.id });
    }

    // Search by name / email / phone
    if (search && search.trim() !== '') {
      qb.andWhere(
        '(contact.name ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const safeSortBy =
      sortBy === 'name' || sortBy === 'createdAt' ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`contact.${safeSortBy}`, safeSortOrder);

    // Pagination
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    qb.skip(skip).take(pageLimit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
        isAdmin,
        fetchAll,
      },
    };
  }

  /** READ - single contact */
  async findOne(user: User | any, id: number): Promise<Contact> {
    const contact = await this.contactsRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!this.isAdmin(user) && contact.owner.id !== user.id) {
      throw new ForbiddenException('You do not own this contact');
    }

    return contact;
  }

  /** UPDATE */
  async update(
    user: User | any,
    id: number,
    updateContactDto: UpdateContactDto,
    photoFilename?: string | null,
  ): Promise<Contact> {
    const contact = await this.contactsRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!this.isAdmin(user) && contact.owner.id !== user.id) {
      throw new ForbiddenException('You do not own this contact');
    }

    // Update fields
    if (typeof updateContactDto.name !== 'undefined') {
      contact.name = updateContactDto.name;
    }
    if (typeof updateContactDto.email !== 'undefined') {
      contact.email = updateContactDto.email;
    }
    if (typeof updateContactDto.phone !== 'undefined') {
      contact.phone = updateContactDto.phone;
    }

    // If a new photo is uploaded
    if (typeof photoFilename !== 'undefined') {
      contact.photo = photoFilename ?? null;
    }

    return this.contactsRepo.save(contact);
  }

  /** DELETE */
  async remove(user: User | any, id: number): Promise<void> {
    const contact = await this.contactsRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!this.isAdmin(user) && contact.owner.id !== user.id) {
      throw new ForbiddenException('You do not own this contact');
    }

    await this.contactsRepo.remove(contact);
  }
}
