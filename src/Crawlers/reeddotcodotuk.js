const Last = require('../models/Last');
const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');
const he = require('he');
let Parser = require('rss-parser');
let parser = new Parser();
const updateCompany = require('../utils/updateCompany');


const reeddotcodotukJobs = async () => {
    try {
        let html = await axios.get('https://www.reed.co.uk/jobs/visa-sponsorship-jobs?parentsector=it-telecoms');
        const $ = cheerio.load(html.data);
        const jobs = await Promise.all($('.job-result').map(async (i, el) => {
            const title = $(el).find('.gtmJobTitleClickResponsive').text().trim();
            const company = $(el).find('.gtmJobListingPostedBy').text().trim();
            const content = $(el).find('.description p').text().trim();
            let location;
            if ($(el).find('.location').text().trim().split('\n')[0].split(',').length > 1) {
                location = $(el).find('.location').text().trim().split('\n')[0];
            } else {
                location = $(el).find('.location').text().trim().split('\n')[0] + ', UK';
            }
            let url = $(el).find('.gtmJobTitleClickResponsive').attr('href');
            if (!url.startsWith('https://www.reed.co.uk')) {
                url = 'https://www.reed.co.uk' + url;
            }
            let options = '';
            if ($(el).find('.salary').text().trim()) {
                options = $(el).find('.salary').text().trim().replace(' - ', ' up to ').trim();
            }
            if ($(el).find('.time').text().trim()) {
                if (options === '') {
                    options = $(el).find('.time').text().trim().replace(', ', ' - ').trim();
                } else {
                    options = options + ' - ' + $(el).find('.time').text().trim().replace(', ', ' - ').trim();
                }
            }
            const hashtags = title.toLowerCase()
                .replace('full stack', 'fullstack')
                .replace('big data', 'big-data')
                .replace('software','')
                .replace('engineer','')
                .replace('developer','')
                .replace('.net', 'dotnet')
                .replace(/[^\w\s]/gi, '')
                .replace(' and ', ' ')
                .replace(' or ', ' ')
                .replace(' with ', ' ')
                .replace('success', ' ')
                .replace('-', '')
                .replace('/', '')
                .split(' ')
                .filter(item => item.length > 2).map(item => item.replace(/[^\w\s]/gi, ''));
            const exist = await Last.findOne({
                where: "reed.co.uk",
                guid: url
            });
            if (!exist) {
                await new Last({
                    where: "reed.co.uk",
                    guid: url,
                }).save();
                updateCompany({ title, company, location, content, url, hashtags });
                return {
                    title,
                    company,
                    location,
                    content,
                    url,
                    hashtags,
                    source: 'reed',
                };
            } else {
                return null;
            }
        }));

        return (await jobs).filter(item => item);
    } catch (err) {
        console.log(err)
    }
}


module.exports = {
    reeddotcodotukJobs
}