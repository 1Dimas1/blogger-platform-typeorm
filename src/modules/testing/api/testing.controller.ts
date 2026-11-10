import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestingService } from '../application/testing.service';
import { Constants } from '../../../core/constants';

@Controller(Constants.PATH.TESTING)
export class TestingController {
  constructor(private testingService: TestingService) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Clear database: delete all data from all tables/collections',
    description:
      'Removes all data from blogs, posts, comments, likes, and users collections.',
  })
  @ApiResponse({ status: 204, description: 'All data is deleted successfully' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error occurred while deleting data',
  })
  async deleteAllData() {
    return this.testingService.deleteAllData();
  }
}
