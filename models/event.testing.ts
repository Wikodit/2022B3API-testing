import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { BaseRouteTesting } from '../base-route';
import * as dayjs from 'dayjs'

export class EventsTesting extends BaseRouteTesting {
  constructor(app: INestApplication) {
    super(app, 'events');
  }

  // @TODO CHIFFREMENT PASSWORD
  // @TODO check if password is return
  routeTest() {
    describe('route', () => {
      describe('events', () => {
        // POST events
        describe('POST events/', () => {
          beforeEach(async () => {
            await this.createAllUsers()
          })
          it('should throw error because no access token', async () =>{
            await this.customPostWithoutAccessToken('').expectStatus(401).expectBodyContains('Unauthorized')
          })
          this.itu('should return 201 with user role', async () =>{
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
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
            })
          })
          this.itu('should return 401 because of the same event the same day with user role', async () =>{
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
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
            })
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
            }).expectStatus(401)
          })

          this.itu('should return 401 because of 3 TT in the same week', async () =>{
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
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
            })
            await this.create().withJson({
              date: dayjs().startOf('week').add(1, 'day').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
            }).expectStatus(201)
            await this.create().withJson({
              date: dayjs().startOf('week').add(2, 'day').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'RemoteWork'
            }).expectStatus(401)
          })

          this.itu('should return 201 with user role', async () =>{
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
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
            }).expectBodyContains('Pending')
          })

          this.itu('should return 401 because of 2 event the same day', async () =>{
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
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
            })
            await this.create().withJson({
              date: dayjs().startOf('week').toDate(),
              eventDescription: faker.random.words(5),
              eventType: 'PaidLeave'
            }).expectStatus(401)
          })
        })
      });


      describe('Get events/', () => {
        beforeEach(async () => {
          await this.createAllUsers()
          await this.setAdminAccessToken()
          await this.create().withJson({
            date: dayjs().startOf('week').toDate(),
            eventDescription: faker.random.words(5),
            eventType: 'PaidLeave'
          }).expectStatus(201)
        })

        this.itu('should return 200', async () => {
          await this.find().expectStatus(200)
        })
      });

      describe('Get events/id', () => {
        let event: { id: string, [k: string]: unknown };
        beforeEach(async () => {
          await this.createAllUsers()
          await this.setAdminAccessToken()
          event = await this.create().withJson({
            date: dayjs().startOf('week').toDate(),
            eventDescription: faker.random.words(5),
            eventType: 'PaidLeave'
          }).expectStatus(201).returns('res.body')
        })
        this.itu('should return 200', async () => {
          await this.findById(event.id).expectStatus(200).expectJsonSchema({
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              date: {
                type: 'string'
              },
              eventStatus: {
                type: 'string'
              },
              eventType: {
                type: 'string'
              },
              userId: {
                type: 'string'
              },
            }
          })
        })
      });

      describe('Get events/id/validate', () => {
        let event: { id: string, [k: string]: unknown };
        let project: Record<string, unknown>;
        let projectUser: Record<string, unknown>;
        beforeEach(async () => {
          await this.createAllUsers()
          await this.setAdminAccessToken();
          project = await this.customPostwithPath('projects/').withJson({
            name: faker.random.words(5),
            referringEmployeeId: this.projectManagerId
          }).expectStatus(201).returns('res.body');

          projectUser = await this.customPostwithPath('project-users/').withJson({
            projectId: project.id,
            userId: this.userId,
            startDate: dayjs().startOf('week').toDate(),
            endDate: dayjs().startOf('week').add(1, 'month').toDate()
          }).expectStatus(201).returns('res.body')

          await this.setAccessToken()
          event = await this.create().withJson({
            date: dayjs().startOf('week').toDate(),
            eventDescription: faker.random.words(5),
            eventType: 'PaidLeave'
          }).expectStatus(201).returns('res.body')

        })

        this.itu('should return 401 with employee role', async () => {
          const res: any = await this.customPostById('validate', event.id)
          expect(res.statusCode).toBe(401)
        })

        this.ita('should return 200 or 201 with admin role', async () => {
          const res: any = await this.customPostById('validate', event.id)
          expect([200,201].includes(res.statusCode)).toBe(true)
        })

        this.itm('should return 200 or 201 with manager 1 role', async () => {
          const res: any = await this.customPostById('validate', event.id)
          expect([200,201].includes(res.statusCode)).toBe(true)
        })

        this.itm2('should return 401 with manager 2 role', async () => {
          const res: any = await this.customPostById('validate', event.id)
          expect(res.statusCode).toBe(401)
        })
      });

      describe('Get events/id/decline', () => {
        let event: { id: string, [k: string]: unknown };
        let project: Record<string, unknown>;
        let projectUser: Record<string, unknown>;
        beforeEach(async () => {
          await this.createAllUsers()
          await this.setAdminAccessToken();
          project = await this.customPostwithPath('projects/').withJson({
            name: faker.random.words(5),
            referringEmployeeId: this.projectManagerId
          }).expectStatus(201).returns('res.body');

          projectUser = await this.customPostwithPath('project-users/').withJson({
            projectId: project.id,
            userId: this.userId,
            startDate: dayjs().startOf('week').toDate(),
            endDate: dayjs().startOf('week').add(1, 'month').toDate()
          }).expectStatus(201).returns('res.body')

          await this.setAccessToken()
          event = await this.create().withJson({
            date: dayjs().startOf('week').toDate(),
            eventDescription: faker.random.words(5),
            eventType: 'PaidLeave'
          }).expectStatus(201).returns('res.body')

        })

        this.itu('should return 401 with employee role', async () => {
          const res: any = await this.customPostById('decline', event.id)
          expect(res.statusCode).toBe(401)
        })

        this.ita('should return 200 or 201 with admin role', async () => {
          const res: any = await this.customPostById('decline', event.id)
          expect([200,201].includes(res.statusCode)).toBe(true)
        })

        this.itm('should return 200 or 201 with manager 1 role', async () => {
          const res: any = await this.customPostById('decline', event.id)
          expect([200,201].includes(res.statusCode)).toBe(true)
        })

        this.itm2('should return 401 with manager 2 role', async () => {
          const res: any = await this.customPostById('decline', event.id)
          expect(res.statusCode).toBe(401)
        })
      });
    });
  }
}
