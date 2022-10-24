import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { BaseRouteTesting } from '../base-route';
import * as dayjs from 'dayjs'

export class DaySixPartOneTesting extends BaseRouteTesting {
  constructor(app: INestApplication) {
    super(app, 'events');
  }

  // @TODO CHIFFREMENT PASSWORD
  // @TODO check if password is return
  routeTest() {
    describe('route', () => {
      describe('get /users/:id/meal-vouchers/:month', () => {
        beforeAll( async () => {
          await this.setAdminAccessToken();

          const createProjectDto = {
            name: faker.random.words(5),
            referringEmployeeId: this.projectManagerId
          }
          const project = await this.customPostwithPath('projects/').withJson(createProjectDto).expectStatus(201).returns('res.body') as any;

          const date = dayjs().startOf('month').toDate()
          await this.customPostwithPath('project-users/').withJson({
            projectId: project.id,
            userId: this.userId,
            startDate: date,
            endDate: dayjs(date).add(2, 'month').toDate()
          }).expectStatus(201)

          await this.setAccessToken();
          const id = await this.customPostwithPath('events').withJson({
            date: dayjs(date).add(1, 'month').add(1,'week').startOf('week').toDate(),
            eventDescription: faker.random.words(5),
            eventType: 'PaidLeave'
            
          }).expectStatus(201).expectJsonSchema({
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              eventDescription: {
                type: 'string'
              },
              eventType: {
                type: 'string'
              },
            }
          }).returns('id')

          await this.setAdminAccessToken();

          await this.customPostwithPath('events/'+id+'/validate').expectStatus(201)
        })
        this.itu('should return 200', async () => {
          const month = dayjs().month();
          return this.customGetById('meal-vouchers/'+month, this.userId).expectStatus(200);
        });
        this.itu('should return 168 in body', async () => {
          const month = dayjs().month();
          return this.customGetById('meal-vouchers/'+month, this.userId).expectStatus(200).expectBodyContains(getBuisenessDaysNumberInAMonth(month)* 8);
        });
        this.itu('should return 168 in body', async () => {
          const month = dayjs().month();
          return this.customGetById('meal-vouchers/'+(month+1), this.userId).expectStatus(200).expectBodyContains((getBuisenessDaysNumberInAMonth(month+1) - 1) * 8);
        });
      });
    });
  }
}

const getBuisenessDaysNumberInAMonth = (month: number) => {
  const start = dayjs().month(month)
  const daysInMonth = start.daysInMonth()
  const workingDays = [1,2,3,4,5]
  let count = 0
  for (let i = 1; i <= daysInMonth; i++) {
    if (workingDays.includes(dayjs().date(i).month(month).day())) {
      count ++;
    }
  }
  return count
}
