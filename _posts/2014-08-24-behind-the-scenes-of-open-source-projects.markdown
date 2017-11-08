---
layout:     post
title:      "Hotspots, complexity, popularity: behind the scenes of open-source projects"
subtitle:   "A story about commits..."
date:       2017-11-07s 11:00:00
author:     "Miguel"
header-img: "img/post-bg-04.jpg"
---

<p>In the previous story, Oliver Liechti told us about the mechanism of technical dept, and provided us ways to analyze and optimize this code complexity, in order to avoid reproducing mistakes and to find a means to properly reduce this dept. Here again, we go behind the scenes of working processes firstly by analyzing commits of projects, then by analyzing and correlate those projects' popularity.</p>

<blockquote>Through this story, we will analyze three different softwares that almost do the same job: <a href="https://github.com/spring-projects/spring-boot">Spring Boot</a>, <a href="https://github.com/wildfly-swarm/wildfly-swarm">WildFly Swarm</a>, and <a href="https://github.com/dropwizard/dropwizard">Dropwizard</a>. As indicative basis, all those are libraries that allow one to build production-ready RESTful web services.</blockquote>

<p>Nowadays, huge (and not-that-huge) projects are ruled by the need of properly structuring and organizing them. From the agile software development to the build processes, as well as the code itself, not forgetting the version control system (VCS). If you do not follow the key advices in this sector, your project will quickly become a huge mess instead of a that huge project you dreamed about!</p>

<h2 class="section-heading">Tell Me More About Commits!</h2>

<p>As you may know, a commit adds the latest changes to a part of - or all - the source code of a repository. Its purpose is to keep records of the changes through the progress of the project, which makes VSC essential in every self-respecting project. One expects that commits are often pushed to the repository and have an explicit description, so the backup process will not be that painful if something bad would happen. In this story, we will analyze three data categories related to commits: their number (churn), their frequency and their size (the numbebr of changed lines).</p>

<h2 class="section-heading">First, let's have a look at general comparative charts...</h2>

<p>
    Well then, it is now time to get our hand dirty. In the first chart below, you can see a comparison of the average number of commits per days and the average size per commit, for each project. If you move your cursor over a circle, you will get more information about the values. Feel also free to change the number of days from which the data are calculated by dragging the slider.<br/>
    <svg class="scatterplot-commits-average"></svg>
    At first sight, you can see that the average number of commits and their average size seem to not be correlated at all. Indeed, the size of commits of WildFly Swarm seems to always be the highest, while its average number of commits per day is pretty low. Spring Boot always has the highest average number of commits, and a medium size average, while DropWizard is widely dominated by the other projects in any period for its size. Since Spring Boot has the highest numbebr of commits, these results are logical. For this reason, we will have a closer look at this project in the next chapters.
</p>

<h2 class="section-heading">So now, zoom in one project and its internal modules...</h2>
As seen before, Spring Boot is a huge project. As other projects usually work, it is separated in modules - actually "projects" in its own nomenclature - which provide us great data to analyze. Looking at the <a href="https://github.com/spring-projects/spring-boot">Spring Boot repository</a>, it seems that the modules are contained within the "spring-boot-project" folder. Currently, there are 13 different modules:
<img src="{{ "/img/spring-boot-projects.png" | prepend: site.baseurl }}" width="250" />

The chart below is based on the previous one and works excactly the same way as it, but it analyzes modules instead of projects. You can see that the days slider is shorter than the one above because the analyzed folders exist since a shorter time, certainly because of code restructuring.

<svg class="scatterplot-spring-module-average"></svg>

<!-- <h2 class="section-heading">What if we look more precisely at the files of these modules?</h2> -->

<h2 class="section-heading">Can we calculate some kind of "complexity score" based on these data for a given project?</h2>

<p>
    OK, brace yourself. It would be nice if we could compare some kind of commits-related complexity score between several projects, so we would be able to order projects by their score and thus to make a list of the most dreamy projects. First thing first, we need to select some metrics from which the score will be calculated. So, what interesting metrics can we have from commits?
</p>

<p>
    At first sight, we could simply think of the number of commits for a project for a given period, which will be called "<strong>churn</strong>" from now. Since we have the period and the churn, we are also able to calculate the <strong>frequency</strong> of commits. Then, we need to calculate some kind of score for <u>each</u> commit separately, in order to be able to calculate a global score that will interfere with our final complexity score. Since the most important metric that characterizes the complexity of <u>one</u> commit is its <strong>size</strong> after all, we will also take this size into account for our calculation. Here, we are going to simply sum the number of added and removed lines for a commit in order to have its size. We are aware that this way is not the <i>best</i> way to calculate the size since we should also take into account the weight of the modifications, but let us keep this calculation for reasons of simplicity.
</p>

<p>
    That being said, let us imagine one project "KindProject" in which all the commits were done in the first months of its life, and then almost no commit were done until now. This project would have a really high complexity score at its beginning, but would have a decent score after some times. If we compare this project with another "MeanProject" project that have exactly the same number of commits but with most of them made during the last months, our bad "MeanProject" must have a higher complexity score than our nice "KindProject", obviously. From this conclusion, we have to take into account one more metrics: the <strong>age</strong> of the commit, which will give it a certain weighting. If a commit is really old, we do not really care about it, but if one commit was made 2 hours from now, we want it to have a heavy weight.
</p>

<p>
    In summary, we have now <strong>3</strong> commits metrics that we will use to calculate our complexity score: the churn of commits, their size and their age. We first want to calculate a score for each commit. This score will act as a multiplicative coefficient for our complexity score. We will then multiply each coefficient of each commit with its size, and then sum all the results in order to have a global complexity score for one given project. If you are curious about our barbaric way to calculate this coefficient, you can read the following next chapters. Otherwise, just go after the following chart.
</p>

<p>
    Let us say that one commit's age score is a multiplicative inverse (1/<i>x</i>) related to its date, so the older the commit is, the lesser the coefficient will be. Score should decrease faster at the beginning, and slower after some days, which conduct us to add exponential behavious with a power-calculated divisor. We can thus say that a commit's age score would be something like 1/2^<i>x</i>, where <i>x</i> is the number of days between the commit date and now. Let us also say that a commit is <i>really</i> important if it is less than one week old, so the coefficient must start to be lesser than 1 after 7 days, which give us 1/2^(<i>x</i>-7). In order to avoid our function to decrease to quickly, we still need to divide the divisor by a coefficient. After some test, it seems that 30 is a good value, which finally gives us the following function: 1/2^((<i>x</i>-7)/30). The following chart generated with the fabulous <a href="http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiIxLzJeKCh4LTcpLzMwKSIsImNvbG9yIjoiIzAwMDAwMCJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIjAiLCIzNjUiLCIwIiwiMSJdLCJncmlkIjpbIjIwIiwiMC4xIl0sInNpemUiOls2NTAsNTAwXSwic2hvd2dyaWQiOjB9XQ--">FooPlot</a> draws that function; the y-axis is the value of the coefficient, while the x-axis is the age of the commit in days.
</p>

<img src="{{ "/img/age-score.svg" | prepend: site.baseurl }}" />

<p>
    As you can see, the coefficient is already 0.5 after about one month. Two months commits will give a coefficient of 0.25. After 300 days, the commit is worth almost nothing anymore.<br/>
    Finally, note that we do not want to have coefficients greater that 1, so every time <i>x</i> is lesser than 7, we will give it the value 7.
</p>
<p>
    Now, we just want to multiply this coefficient with the size of the commit in order to get the complexity score of this commit, and sum all the complexity scores in order to have one global complexity score for the project. Easy-Peasy! Here is a short example with imaginary commits:
    <table>
        <tr>
            <th>Days from Now</th>
            <th>Added Lines</th>
            <th>Removed Lines</th>
            <th>Coefficient</th>
            <th>Size</th>
            <th>Score</th>
        </tr>
        <tr>
            <td>2</td>
            <td>42</td>
            <td>8</td>
            <td>1</td>
            <td>50</td>
            <td><strong>50</strong></td>
        </tr>
        <tr>
            <td>12</td>
            <td>56</td>
            <td>32</td>
            <td>0.89</td>
            <td>88</td>
            <td><strong>78.32</strong></td>
        </tr>
        <tr>
            <td>40</td>
            <td>127</td>
            <td>11</td>
            <td>0.47</td>
            <td>138</td>
            <td><strong>64.86</strong></td>
        </tr>
        <tr>
            <td>267</td>
            <td>2345</td>
            <td>0</td>
            <td>0.002</td>
            <td>2345</td>
            <td><strong>4.69</strong></td>
        </tr>
    </table>
    The final score of this huge 4-commits project will thus be approximately:<br/>
    50 + 78.32 + 64.86 + 4.69 = <strong><u>197.87</u></strong>
</p>


<h2 class="section-heading">What about the evolution of this score during the previous months?</h2>
Having the final score for a project is a good start point, but what we <i>really</i> need is to have the evolution of this score during the past, in order to analyze this evolution and to compare it with the evolution of other projects. What we did here is aggregating commits by month, then calculating the total complexity score of each month separately.

<svg class="line-chart-complexity-score"></svg>

<div class="legend-complexity-line-chart">
    <div> <p class="country-name"><span class="key-dot size"></span>Size</p> </div>
    <div> <p class="country-name"><span class="key-dot coefficient"></span>Coefficient</p> </div>
    <div> <p class="country-name"><span class="key-dot complexityScore"></span><strong>Complexity Score</strong></p> </div>
</div>

<h2 class="section-heading">Okay, complexity scores are nice and all, but can we correlate those values with... let's say... the project's popularity?</h2>

<h2 class="section-heading">What can we conclude? What do we need now?</h2>
=> Machine Learning